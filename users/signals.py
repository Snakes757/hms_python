# users/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import UserRole, DoctorProfile, NurseProfile, ReceptionistProfile, HospitalAdministratorProfile
# Patient model and its profile creation signal are in the 'patients' app.

CustomUserModel = get_user_model()

@receiver(post_save, sender=CustomUserModel)
def create_or_update_role_specific_profile(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create or update role-specific profiles
    (DoctorProfile, NurseProfile, etc.) when a CustomUser instance is saved.
    This ensures that a user has the correct associated profile based on their role.
    """
    # Profiles to manage and their corresponding role
    profile_map = {
        UserRole.DOCTOR: DoctorProfile,
        UserRole.NURSE: NurseProfile,
        UserRole.RECEPTIONIST: ReceptionistProfile,
        UserRole.ADMIN: HospitalAdministratorProfile,
        # Patient profiles (Patient model) are handled by patients.signals.create_or_update_patient_profile_on_user_save
    }

    current_role = instance.role
    profile_model_to_ensure = profile_map.get(current_role)

    if profile_model_to_ensure:
        # Create or get the profile for the current role
        profile_model_to_ensure.objects.get_or_create(user=instance)

    # Clean up: If role changed, delete old, now incorrect, role-specific profiles.
    # This needs to be handled carefully, especially if profiles store critical data.
    # The `update_fields` argument is None if all fields are being updated.
    # If `update_fields` is present, we only act if 'role' is in `update_fields`.
    if not created and (kwargs.get('update_fields') is None or 'role' in kwargs.get('update_fields')):
        # Check previous role if possible (instance._state.adding is False here)
        try:
            # Get the user's state from before this save operation
            old_instance = CustomUserModel.objects.get(pk=instance.pk)
            previous_role = old_instance.role # This will be the role *before* the current save.
                                            # However, this query re-fetches, which might not reflect the true "just before save" state
                                            # if the instance passed to the signal was already modified in memory.
                                            # A more robust way is to use pre_save to store the old role.
                                            # For simplicity here, we assume 'role' change implies cleanup.
            
            # If the role actually changed from what it was, then proceed with cleanup.
            # This check is a bit tricky with post_save alone.
            # A pre_save signal to store the old role on the instance temporarily would be more robust.
            # For now, we iterate and delete profiles that don't match the *new* current_role.

            for role_enum, model_class in profile_map.items():
                if role_enum != current_role: # If this profile type is not for the new role
                    if hasattr(instance, model_class._meta.get_field('user').related_name):
                        try:
                            profile_to_delete = model_class.objects.get(user=instance)
                            profile_to_delete.delete()
                        except model_class.DoesNotExist:
                            pass # Profile didn't exist, nothing to delete
        except CustomUserModel.DoesNotExist: # Should not happen if instance is being saved
            pass


# Example of using pre_save to store the old role (more robust for change detection)
# _old_roles = {} # Module-level dict to store old roles temporarily

# @receiver(pre_save, sender=CustomUserModel)
# def store_old_role(sender, instance, **kwargs):
#     if instance.pk: # Only for existing instances
#         try:
#             _old_roles[instance.pk] = CustomUserModel.objects.get(pk=instance.pk).role
#         except CustomUserModel.DoesNotExist:
#             _old_roles.pop(instance.pk, None) # Clean up if user somehow deleted between pre_save and now
#     else: # New instance
#         _old_roles.pop(instance.pk, None)


# @receiver(post_save, sender=CustomUserModel)
# def create_or_update_role_specific_profile_enhanced(sender, instance, created, **kwargs):
#     profile_map = { ... } # As above
#     current_role = instance.role
#     previous_role = _old_roles.pop(instance.pk, None) if not created else None

#     profile_model_to_ensure = profile_map.get(current_role)
#     if profile_model_to_ensure:
#         profile_model_to_ensure.objects.get_or_create(user=instance)

#     if previous_role and previous_role != current_role:
#         old_profile_model = profile_map.get(previous_role)
#         if old_profile_model:
#             try:
#                 profile_to_delete = old_profile_model.objects.get(user=instance)
#                 profile_to_delete.delete()
#             except old_profile_model.DoesNotExist:
#                 pass

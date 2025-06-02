import React from 'react';

/**
 * A simple loading spinner component.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.message="Loading..."] - The message to display below the spinner.
 * @param {string} [props.size="md"] - The size of the spinner ('sm', 'md', 'lg').
 * @param {string} [props.spinnerColor="text-blue-500"] - Tailwind CSS class for spinner color.
 * @param {string} [props.textColor="text-gray-500"] - Tailwind CSS class for text color.
 * @param {string} [props.className=""] - Additional classes for the container.
 */
const LoadingSpinner = ({
  message = "Loading...",
  size = "md", // Default size
  spinnerColor = "text-blue-500", // Default spinner color using Tailwind
  textColor = "text-gray-500",   // Default text color using Tailwind
  className = "",                 // Allow additional classes for the container
}) => {
  let spinnerSizeClass = "h-8 w-8"; // Default to md
  if (size === "sm") {
    spinnerSizeClass = "h-5 w-5";
  } else if (size === "lg") {
    spinnerSizeClass = "h-12 w-12";
  }

  // If size is 'sm', don't show the message to keep it compact, e.g., for buttons
  const showMessage = size !== "sm";

  return (
    <div
      className={`flex flex-col justify-center items-center ${className}`}
      // Removed minHeight to make it more flexible, especially for inline use like in buttons.
      // Parent component can control height if needed.
    >
      <div
        className={`animate-spin rounded-full ${spinnerSizeClass} border-t-2 border-b-2 ${spinnerColor.replace('text-', 'border-')}`} // Use border color from spinnerColor
        role="status"
      >
        <span className="sr-only">{message}</span> {/* For accessibility */}
      </div>
      {showMessage && message && (
        <p className={`mt-2 text-sm ${textColor}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

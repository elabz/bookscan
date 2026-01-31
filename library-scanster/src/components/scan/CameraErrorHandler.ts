
export const getCameraErrorMessage = (err: any): string => {
  let errorMsg = "Camera access denied. Please check your permissions and try again.";
  
  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
    errorMsg = "Camera access was denied. Please allow camera access in your browser settings.";
  } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    errorMsg = "No camera found on your device.";
  } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
    errorMsg = "Camera is already in use by another application.";
  } else if (err.name === "OverconstrainedError") {
    errorMsg = "Camera doesn't meet the required constraints.";
  }
  
  return errorMsg;
};

export const isCameraSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

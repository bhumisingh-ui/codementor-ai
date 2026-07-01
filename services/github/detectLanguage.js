export function detectLanguage(filename) {
  if (!filename || typeof filename !== "string") return null;
  const extension = filename.split(".").pop().toLowerCase();

  switch (extension) {
    case "js":
      return "javascript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "hh":
    case "hxx":
      return "cpp";
    case "go":
      return "go";
    default:
      return null;
  }
}

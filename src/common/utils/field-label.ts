// "phoneNumber" -> "Phone number", "_id" -> "Id"
export function labelFor(field: string): string {
  const words = field.replace(/^_+/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

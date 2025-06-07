function keyToLabel(key) {
  return key.replace(/_/g, ' ');
}

function addLabelFields(obj, targetObject = 'metadata') {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  // Add labels for the specified object (default: metadata)
  if (result[targetObject] && typeof result[targetObject] === 'object') {
    const originalFields = result[targetObject];
    const labelsToAdd = {};
    
    Object.keys(originalFields).forEach(key => {
      // Create label for ALL keys, not just those with underscores
      labelsToAdd[`${key}_label`] = keyToLabel(key);
    });
    
    result[targetObject] = {
      ...originalFields,
      ...labelsToAdd
    };
  }
  
  return result;
}

export { keyToLabel, addLabelFields };
function keyToLabel(key) {
  return key.replace(/_/g, ' ');
}

function addLabelFields(obj, targetObject = 'metadata') {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };

  // Check of het item een metadata obj bevat en of dit daadwerkelijk een type Object is
  if (result[targetObject] && typeof result[targetObject] === 'object') {
    const originalFields = result[targetObject];
    const labelsToAdd = {};
    
    Object.keys(originalFields).forEach(key => {
      // Label benamingen gebaseerd op originele field naam
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
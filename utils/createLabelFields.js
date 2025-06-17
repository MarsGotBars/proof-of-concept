/**
 * Converteert een veldnaam naar een leesbaar label door underscores te vervangen met spaties.
 * 
 * @param {string} key - De veldnaam om te converteren
 * @returns {string} Het geconverteerde label
 * @example
 * keyToLabel('plaats_van_uitgave') // returns 'plaats van uitgave'
 */
function keyToLabel(key) {
  return key.replace(/_/g, ' ');
}

/**
 * Voegt label velden toe aan een object voor weergavedoeleinden.
 * Voor elk veld in het target object wordt een bijbehorend '{veld}_label' veld aangemaakt.
 * 
 * @param {Object} obj - Het object waaraan labels toegevoegd moeten worden
 * @param {string} [targetObject='metadata'] - De naam van het sub-object waar labels aan toegevoegd moeten worden
 * @returns {Object} Het object met toegevoegde label velden
 * @example
 * addLabelFields({ metadata: { auteur: 'Smith' } })
 * // returns { metadata: { auteur: 'Smith', auteur_label: 'auteur' } }
 */
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
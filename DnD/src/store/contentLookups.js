export const itemLookup = {};
export const spellLookup = {};
export const monsterLookup = {};

export const hydrateLookups = ({ items = {}, spells = {}, monsters = {} } = {}) => {
  Object.assign(itemLookup, items);
  Object.assign(spellLookup, spells);
  Object.assign(monsterLookup, monsters);
};

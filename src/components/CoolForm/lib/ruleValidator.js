export default (formData, rules) => {
  const errorArr = Object.keys(rules)
    .map(key => {
      if (rules[key](formData[key])) {
        return { key, value: formData[key] };
      }
      return false;
    })
    .filter(Boolean);
  return errorArr.length === 0 ? undefined : errorArr;
};

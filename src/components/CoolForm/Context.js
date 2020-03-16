import { createContext } from 'react';

export default createContext({
  formData: {},
  onChangeFormItem: () => {},
  validated: false,
  operate: undefined,
  rules: [],
});

import { has, chain, forEach, get, cloneDeep } from 'lodash-es';
import { Form } from 'antd';

export default {
  registerForm: (forms, form, formId) => {
    let nextForms = [...forms];
    if (!forms.find(v => v.id === formId)) {
      nextForms = forms.concat({ id: formId, form });
    }
    return nextForms;
  },
  unRegisterForm: (forms, form, formId) => {
    const result = [...forms];

    if (forms.find(v => v.id === formId)) {
      delete result[formId];
    }

    return result;
  },
  mapObjToFields: obj => {
    const result = {};

    if (typeof obj === 'object' && obj !== null) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(obj)) {
        // value可以是字段值，也可以是包含了验证信息的对象
        const fVal =
          has(value, 'validating') ||
          has(value, 'dirty') ||
          has(value, 'touched')
            ? value
            : { value };

        result[key] = Form.createFormField({
          ...fVal,
        });
      }
    }

    return result;
  },
  queryValue: objWithValidate => {
    return has(objWithValidate, 'value')
      ? objWithValidate.value
      : objWithValidate;
  },
  setData(state, action) {
    const {
      payload: { operations },
    } = action;

    const [name, ...operationsRest] = operations;
    const nextObjectToChange = cloneDeep(get(state, name));
    let stateToChange = chain(nextObjectToChange);

    forEach(operationsRest, v => {
      const [v0, ...vRest] = v;
      stateToChange = stateToChange[`${v0}`](...vRest);
    });
    stateToChange = stateToChange.value();

    const nextState = {
      ...state,
      [name]: nextObjectToChange,
    };
    return nextState;
  },
};

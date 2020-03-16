const rule = value => {
  let result = true;
  if (value != null) {
    result = /^$/.test(value);
  }
  return result;
};

export default [
  [
    {
      label: 'label1',
      formKey: 'label1',
      required: true,
      type: 'input',
      rule,
      style: { background: 'rgba(255, 0, 0, 0.1)' },
    },
    {
      label: 'label2',
      formKey: 'label2',
      required: true,
      type: 'input',
      rule,
      style: { background: 'rgba(0, 255, 0, 0.1)' },
    },
    {
      label: 'label3',
      formKey: 'label3',
      required: true,
      placeholder: '请输入',
      type: 'inputnumber',
      rule,
      style: { background: 'rgba(0, 255, 255, 0.1)' },
    },
  ],
  [
    {
      label: 'label4',
      formKey: 'label4',
      required: true,
      type: 'select',
      optionsType: 'deviceTypeList',
      rule,
    },
    {
      label: 'label5',
      formKey: 'label5',
      type: 'select',
      style: { background: 'rgba(0, 0, 255, 0.1)' },
    },
    {
      label: 'label6',
      formKey: 'label6',
      type: 'select',
    },
  ],
  [
    {
      label: 'label7',
      formKey: 'label7',
      type: 'select',
    },
    {
      label: 'label8',
      formKey: 'label8',
      type: 'input',
    },
    {
      label: 'label8',
      formKey: 'label9',
      type: 'input',
    },
  ],
  [
    {
      label: 'label10',
      formKey: 'label10',
      type: 'input',
    },
    {
      label: 'label11',
      formKey: 'label11',
      type: 'input',
    },
    {
      label: 'label12',
      formKey: 'label12',
      type: 'input',
    },
  ],
  [
    {
      label: 'label13',
      formKey: 'label13',
      type: 'select',
    },
    {
      label: 'label14',
      formKey: 'label14',
      type: 'select',
    },
    {
      label: 'label15',
      formKey: 'label15',
      type: 'select',
    },
  ],
];

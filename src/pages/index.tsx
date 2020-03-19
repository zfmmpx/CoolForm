import React, { useRef, useCallback, useState, useReducer } from 'react';
import styles from './index.less';
import { CoolForm, Input } from '@/components/CoolForm';
import dataConfig from './dataConfig';
import { Button } from 'antd';

const LAYOUT_CONFIG = {
  colLayout: {
    xs: { span: 6 },
    sm: { span: 6 },
    md: { span: 6 },
    lg: { span: 6 },
  },
};

const App = () => {
  const [validateRule, setValidateRule] = useState(() => () => {});
  const [validated, setValidated] = useState(false);

  const [formData, setFormData] = useState({});
  const onChange = useCallback(nextAddParams => {
    setFormData(nextAddParams);
  }, []);

  const onConfirm = useCallback(() => {
    setValidated(true);
    if (Boolean(validateRule())) return; // 如果校验不通过，return
    // TODO 你需要的操作 比如拿到formData传给后台之类
    console.log('formData:', formData);
  }, [formData, validateRule]);

  const saveRules = useCallback(
    (validateFields: Function) => {
      setValidateRule(() => validateFields);
    },
    [setValidateRule],
  );

  return (
    <div>
      <h1 className={styles.title}>CoolForm组件</h1>
      <Button onClick={onConfirm}>确认</Button>
      <CoolForm
        layoutConfig={LAYOUT_CONFIG}
        formData={formData}
        onChange={onChange}
        validated={validated}
        saveRules={saveRules}
      >
        {dataConfig.map((row: Array<object>) => {
          return row.map((v: any, vIndex: number) => {
            return (
              <Input
                key={v.formKey}
                label={v.label}
                formKey={v.formKey}
                required={v.required}
                ruleMessage={v.ruleMessage}
                placeholder={v.placeholder}
                style={v.style} // 定义单个Input样式
                layout={{ offset: vIndex === 0 ? 3 : 0 }}
                rule={v.rule}
                type={v.type}
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 17, offset: 1 }}
                // options={props[v.optionsType] || []} // 定义下拉框的options
              />
            );
          });
        })}
      </CoolForm>
    </div>
  );
};

export default App;

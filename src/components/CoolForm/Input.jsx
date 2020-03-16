/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useState, useEffect, useCallback, useContext, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash-es';
import { Form, Input as InputAntd, InputNumber, Select, Button, Radio, DatePicker } from 'antd';
import { classnames } from 'cool-utils';
import moment from 'moment';
import MyContext from './Context';
import styles from './Input.less';

const { RangePicker } = DatePicker;

const { TextArea } = InputAntd;

const cx = classnames(styles);

const renderRuleMessage = (type, label) => {
  if (type.toLowerCase() === 'input' || type.toLowerCase() === 'inputnumber')
    return `请输入${label}`;
  if (type.toLowerCase() === 'select') return `请选择${label}`;
  return `请输入${label}`;
};

const Input = memo(props => {
  const {
    formKey,
    label,
    required,
    ruleMessage,
    disabled,
    validateStatus,
    help,
    placeholder,
    rule: inputRule,
    type = '',
    min,
    max,
    options,
    labelCol,
    wrapperCol,
    onChange,
    children,
    mode,
    inputStyle,
    isDetail,
    showTime,
    format,
    separator,
    submitText,
    className,
  } = props;
  const rule = required && !inputRule ? val => val !== 0 && !val : inputRule;
  const { formData, onFormChange, validated, setRules, onSubmit, setValidated } = useContext(
    MyContext,
  );
  const value = formData[formKey];
  useEffect(() => {
    if (formKey && rule) {
      setRules({
        [formKey]: rule,
      });
    }
  }, [formKey, rule, setRules]);
  const [isTouched, setIsTouched] = useState(false);
  const onValueChange = useCallback(
    val => {
      const newFormData = { ...formData, [formKey]: val };
      onFormChange(val, formKey, newFormData);
      if (onChange) onChange(val, formKey, newFormData);
      if (!isTouched) {
        setIsTouched(true);
      }
    },
    [formData, formKey, isTouched, onChange, onFormChange],
  );

  const onDateRangeChange = useCallback(
    val => {
      const [start, end] = val;
      const startTime = start.format('YYYY-MM-DD HH:mm:ss');
      const endTime = end.format('YYYY-MM-DD HH:mm:ss');
      onValueChange([startTime, endTime]);
    },
    [onValueChange],
  );

  const onEventChange = useCallback(event => onValueChange(event.target.value), [onValueChange]);

  if (type.toLowerCase() === 'customnode') {
    return <>{children}</>;
  }
  return (
    <Form.Item
      labelAlign="left"
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      className={cx(
        'input',
        { 'unset-line-height': type.toLowerCase() === 'text' },
        `:${className}`,
      )}
      colon={false}
      required={type === 'text' || isDetail ? undefined : required}
      label={label}
      validateStatus={
        validateStatus !== '' &&
        (validateStatus ||
          (rule && (isTouched || validated) && rule(value, formData) ? 'error' : undefined))
      }
      help={
        help !== '' &&
        (help ||
          (rule && (isTouched || validated) && rule(value, formData)
            ? ruleMessage || renderRuleMessage(type, label)
            : undefined))
      }
    >
      {type.toLowerCase() === 'input' && (
        <InputAntd
          disabled={disabled}
          value={value}
          onChange={onEventChange}
          placeholder={placeholder || `请输入${label}`}
          style={inputStyle}
        />
      )}
      {type.toLowerCase() === 'radio' && (
        <Radio.Group
          disabled={disabled}
          value={value}
          onChange={onEventChange}
          placeholder={placeholder || `请输入${label}`}
          style={inputStyle}
        >
          {options.map(option => (
            <Radio value={option.key}>{option.value}</Radio>
          ))}
        </Radio.Group>
      )}
      {type.toLowerCase() === 'textarea' && (
        <TextArea
          disabled={disabled}
          value={value}
          onChange={onEventChange}
          placeholder={placeholder || `请输入${label}`}
          style={inputStyle}
        />
      )}
      {type.toLowerCase() === 'inputnumber' && (
        <InputNumber
          disabled={disabled}
          value={value}
          onChange={onValueChange}
          placeholder={placeholder || `请输入${label}`}
          min={min}
          max={max}
          style={inputStyle}
        />
      )}
      {type.toLowerCase() === 'select' && (
        <Select
          mode={mode}
          disabled={disabled}
          value={value || undefined}
          onChange={onValueChange}
          placeholder={placeholder || `请选择${label}`}
          optionFilterProp="children"
          showSearch
          filterOption={(input, option) =>
            !input && option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          style={{ width: '100%', ...inputStyle }}
        >
          {options.map(v => (
            <Select.Option key={v.key} value={v.key}>
              {v.value}
            </Select.Option>
          ))}
        </Select>
      )}
      {type.toLowerCase() === 'rangepicker' && (
        <>
          <RangePicker
            style={{ width: '100%', ...inputStyle }}
            showTime={showTime || { format: 'HH:mm:ss' }}
            placeholder={placeholder || ['开始时间', '结束时间']}
            format={format || 'YYYY/MM/DD HH:mm:ss'}
            disabledDate={current => current && current > moment().endOf('day')}
            separator={separator || '-'}
            onChange={onDateRangeChange}
            // onChange={(...b) => console.log('b:', b)}
            // value={moment('2015/01', 'YYYY/MM/DD')}
            // value={[
            //   searchParams.beginTime && moment(searchParams.beginTime),
            //   searchParams.endTime && moment(searchParams.endTime),
            // ]}
            // onChange={value => {
            //   const [start, end] = value;
            //   const beginTime = start.format('YYYY-MM-DD HH:mm');
            //   const endTime = end.format('YYYY-MM-DD HH:mm');
            //   save({ searchParams: { ...searchParams, beginTime, endTime } });
            // }}
          />
        </>
      )}
      {type.toLowerCase() === 'custom' &&
        (isValidElement(children)
          ? (() => {
              console.warn(`Input ${formKey}'s props -> children: function expected.`);
              return children;
            })()
          : children({
              disabled,
              value,
              onChange,
              placeholder,
              min,
              max,
              options,
              formData,
              setIsTouched,
              formKey,
              type,
              isDetail,
              onValueChange,
            }))}
      {type.toLowerCase() === 'buttons' && (
        <>
          <Button
            type="primary"
            onClick={() => {
              if (!validated) {
                setValidated(true);
              }
              onSubmit();
            }}
            style={inputStyle}
          >
            {submitText || '提交'}
          </Button>
          {/* <Button onClick={onCancel}>取消</Button> */}
        </>
      )}
      {type.toLowerCase() === 'text' && (
        <>
          {options.length
            ? (options.find(option => option.key === value) || {}).value
            : Array.isArray(value)
            ? value.map((item, index) => (index != value.length - 1 ? `${item}，` : item))
            : value}
        </>
      )}
    </Form.Item>
  );
}, isEqual);

Input.defaultProps = {
  required: false,
  ruleMessage: undefined,
  disabled: false,
  validateStatus: undefined,
  help: undefined,
  placeholder: undefined,
  rule: undefined,
  min: undefined,
  max: undefined,
  options: [],
  onChange: () => {},
  formKey: undefined,
};

Input.propTypes = {
  formKey: PropTypes.string,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  required: PropTypes.bool,
  ruleMessage: PropTypes.string,
  disabled: PropTypes.bool,
  validateStatus: PropTypes.string,
  help: PropTypes.string,
  placeholder: PropTypes.string,
  rule: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  options: PropTypes.arrayOf(PropTypes.object),
  labelCol: PropTypes.shape({
    span: PropTypes.number,
  }),
  wrapperCol: PropTypes.shape({
    span: PropTypes.number,
  }),
  onChange: PropTypes.func,
  children: PropTypes.func,
  mode: PropTypes.string,
  inputStyle: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  isDetail: PropTypes.bool,
  showTime: PropTypes.shape({ format: PropTypes.string }),
  format: PropTypes.string,
  separator: PropTypes.string,
  submitText: PropTypes.string,
  className: PropTypes.string,
};

export default Input;

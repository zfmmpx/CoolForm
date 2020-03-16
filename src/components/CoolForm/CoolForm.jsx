/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Row, Col } from 'antd';
import PropTypes from 'prop-types';
// import { useCompare } from 'cool-utils';
import MyContext from './Context';
import ruleValidator from './lib/ruleValidator';

const DEFAULT_FORM_DATA = {};

const DEFAULT_ROW_LAYOUT = {
  gutter: 84,
};
const DEFAULT_COL_LAYOUT = {
  xs: { span: 24 },
  sm: { span: 8 },
  md: { span: 8 },
  lg: { span: 8 },
};

const CoolForm = ({
  children,
  layoutConfig,
  formData: initFormData = DEFAULT_FORM_DATA,
  onChange,
  validated: _validated,
  saveRules,
  onSubmit: onFormSubmit,
  onCancel: onFormCancel,
  rowStyle,
}) => {
  const rowLayout = { ...DEFAULT_ROW_LAYOUT, ...layoutConfig.rowLayout };
  const rulesRef = useRef({});
  const [formData, setFormData] = useState(initFormData);
  const [validated, setValidated] = useState(_validated);
  useEffect(() => {
    setValidated(_validated);
  }, [_validated]);
  useEffect(() => {
    setFormData(initFormData);
  }, [initFormData]);
  // useCompare(initFormData, _formData => {
  //   console.log('_formData:', _formData);
  //   setFormData(_formData);
  // });
  const onFormChange = useCallback(
    (value, key, newFormData) => {
      setFormData(newFormData);
      if (onChange) {
        onChange(newFormData, key, value);
      }
    },
    [onChange],
  );

  const setRules = useCallback(
    newRules => {
      rulesRef.current = { ...rulesRef.current, ...newRules };
      if (!saveRules) return;
      saveRules(() => ruleValidator(formData, rulesRef.current));
    },
    [saveRules, formData],
  );

  const onSubmit = useCallback(() => {
    const errorArr = ruleValidator(formData, rulesRef.current);
    if (onFormSubmit) {
      onFormSubmit(errorArr, formData);
    }
  }, [formData, onFormSubmit]);

  const onCancel = useCallback(() => {
    onFormCancel(formData);
  }, [formData, onFormCancel]);

  return (
    <MyContext.Provider
      value={{
        formData,
        onFormChange,
        validated,
        setRules,
        onSubmit,
        onCancel,
        setValidated,
      }}
    >
      {children.map(row => {
        return (
          <Row {...rowLayout} style={rowStyle}>
            {row.map(col => {
              if (!col) {
                return null;
              }
              const { layout, layoutName } = col.props;
              const colLayout = {
                ...DEFAULT_COL_LAYOUT,
                ...layoutConfig.colLayout,
                ...layoutConfig[layoutName],
                ...layout,
              };
              return (
                <Col {...colLayout} style={col.props.style}>
                  {col}
                </Col>
              );
            })}
          </Row>
        );
      })}
    </MyContext.Provider>
  );
};

CoolForm.propTypes = {
  children: PropTypes.node.isRequired,
  layoutConfig: PropTypes.shape({
    // ref to: https://ant.design/components/grid-cn/
    rowLayout: PropTypes.object,
    colLayout: PropTypes.object,
  }),
  formData: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.array,
      PropTypes.bool,
    ]),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  saveRules: PropTypes.func,
  validated: PropTypes.bool.isRequired,
  colOffset: PropTypes.number,
  rules: PropTypes.objectOf(PropTypes.func),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  rowStyle: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
};

CoolForm.defaultProps = {
  layoutConfig: {},
  // eslint-disable-next-line no-console
  onSubmit: console.log,
  // eslint-disable-next-line no-console
  onCancel: console.log,
};

export default CoolForm;

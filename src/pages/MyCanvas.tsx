import React, { useEffect, useCallback } from 'react';
import MyCanvasComponent from '@/components/MyCanvas';
import { Button } from 'antd';
import { connect } from 'dva';

const MyCanvas = ({ dispatch }) => {
  useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
  }, []);
  const preStep = useCallback(() => {
    dispatch({
      type: 'canvas/preStep',
    });
  }, []);
  const deleteCurrentRegion = useCallback(() => {
    dispatch({
      type: 'canvas/deleteCurrentRegion',
    });
  }, []);
  const deleteCurrentUncompletedRegion = useCallback(() => {
    dispatch({
      type: 'canvas/deleteCurrentUncompletedRegion',
    });
  }, []);
  const drawWholdArea = useCallback(() => {
    dispatch({
      type: 'canvas/drawWholdArea',
    });
  }, []);

  return (
    <div id="my-app">
      <Button onClick={preStep}>preStep</Button>
      <Button onClick={deleteCurrentRegion}>deleteCurrentRegion</Button>
      <Button onClick={deleteCurrentUncompletedRegion}>
        deleteCurrentUncompletedRegion
      </Button>
      <Button onClick={drawWholdArea}>drawWholdArea</Button>
      <MyCanvasComponent
      // disabled={
      //   disabled ||
      //   formUtils.queryValue(get(currentScenario, 'affect')) === 'all' ||
      //   !formUtils.queryValue(get(currentScenario, 'scenario'))
      // }
      // isEdit={isEdit}
      />
    </div>
  );
};

export default connect(({ canvas }) => {
  return {
    preStep: canvas.preStep,
  };
})(MyCanvas);

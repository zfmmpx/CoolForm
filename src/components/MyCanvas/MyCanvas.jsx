import React, { useEffect, useState, useRef } from 'react';
import G6 from '@antv/g6';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import { message } from 'antd';
import { flatten, findIndex, find, map, get, reduce } from 'lodash-es';
import utils from '@/common/utils';
import { classnames } from 'cool-utils';
// import formUtils from 'common/formUtils';
import styles from './MyCanvas.less';

const cx = classnames(styles);

const { getElementLeft, getElementTop } = utils;

const MyCanvas = ({
  canvasData,
  layoutScrollTop,
  layoutScrollLeft,
  disabled,
  currentRegion,
  currentRegionLast,
  tempPoint,
  firstDotOfCurrentRegionLastX,
  firstDotOfCurrentRegionLastY,
  origFirstDotOfCurrentRegionLastX,
  origFirstDotOfCurrentRegionLastY,

  justFinishAPolygon,
  nodeIndex,
  currentScenario,
  isEdit,
  dispatch,
}) => {
  const ref = useRef(null);
  const that = useRef({}).current;
  const [g6Data, setG6Data] = useState({ nodes: [], edges: [] });

  // 百分比数据驱动g6Data hook
  useEffect(() => {
    let nodeIdIndex = -1;
    const nextNodes = flatten(
      currentRegion.map(value =>
        value.map((v, vIndex) => {
          nodeIdIndex += 1;
          return {
            x: v.x * canvasData.width,
            y: v.y * canvasData.height,
            id: `node_${nodeIdIndex}`,
            size: v.type === 'temp' ? 1 : 6,
            isLastPoint: vIndex === value.length - 1,
          };
        }),
      ),
    );

    const nextEdges = reduce(
      nextNodes,
      (result, value, vIndex, arr) => {
        if (vIndex === arr.length - 1) {
          return result;
        }
        if (value.isLastPoint) {
          return result;
        }
        result.push({
          id: result?.length + 1,
          source: value?.id,
          target: arr?.[vIndex + 1]?.id,
        });
        return result;
      },
      [],
    );
    const nextG6Data = {
      nodes: nextNodes,
      edges: nextEdges,
    };
    setG6Data(nextG6Data);
  }, [canvasData.height, canvasData.width, currentRegion]);

  // 保持scrollTop数据到redux
  useEffect(() => {
    // const layoutDiv = document.getElementsByClassName(
    //   'base-layout-content ant-layout-content',
    // )[0];
    const layoutDiv = document.getElementById('my-app');
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const nextLayoutScrollTop = layoutDiv.scrollTop;
        const nextLayoutScrollLeft = layoutDiv.scrollLeft;
        dispatch({
          type: 'canvas/save',
          payload: {
            layoutScrollTop: nextLayoutScrollTop,
            layoutScrollLeft: nextLayoutScrollLeft,
          },
        });
      });
    };
    layoutDiv.addEventListener('scroll', handleScroll);
    return () => {
      layoutDiv.removeEventListener('scroll', handleScroll);
    };
  });

  // 初始化和更新Graph
  useEffect(() => {
    if (!that.g6Instance) {
      // 先注册一个自定义边custom-edge
      G6.registerEdge('custom-edge', {
        itemType: 'edge',
        draw: (item, group) => {
          const source = item.sourceNode.getModel();
          const target = item.targetNode.getModel();
          // group代表节点分组，'line'是g6支持的，但是g6官方文档上没写..
          group.addShape('line', {
            attrs: {
              x1: source.x,
              y1: source.y,
              x2: target.x,
              y2: target.y,
              stroke: '#E9E9E9',
            },
          });
          // 拿到所有的nodes，就是你这个多边形所有的点
          const nodes = that.g6Instance.getNodes().map(n => n.getModel());
          const nodesLength = nodes.length;
          const lastNode = nodes[nodes.length - 1];
          const lastSecondNode = nodes[nodes.length - 2];
          const allPolygons = [];
          while (nodes.length > 0) {
            const firstPolygonIndex = findIndex(nodes, n => n.isLastPoint);
            let nodesToDraw = [];
            if (firstPolygonIndex !== -1) {
              nodesToDraw = nodes.splice(0, firstPolygonIndex + 1);
              allPolygons.push(nodesToDraw);
            } else {
              nodesToDraw = nodes.splice(0, nodes.length);
              allPolygons.push(nodesToDraw);
            }
          }
          if (allPolygons.length > 0 && nodesLength > 2) {
            const lastPolygon = allPolygons[allPolygons.length - 1];
            const showDraw =
              (lastPolygon.length !== 1 && lastNode.id === target.id) ||
              (lastPolygon.length === 1 && lastSecondNode.id === target.id);

            // 下面这个showDraw比较难理解。
            // 只有当(lastPolygon.length !== 1 && lastNode.id === target.id)，也就是你的最后一个多边形里面的点多于1个，且你画最后一条线的时候才会画多边形（填色）。
            // 也就是说，你整个画布，也只是在你画最后一条线（指最后一个多边形的最后一条线）的时候画出所有的多边形（也就是给所有多边形填色）
            // 如果没有这个if (showDraw)条件，当你的画布上的点越来越多，填色会越来越深。
            // 可以试着把opacity改为0.02，再注释掉if (showDraw)条件试试。
            if (showDraw) {
              // 画由线框住的多边形
              allPolygons.forEach(nodesToDraw => {
                if (nodesToDraw.length > 2) {
                  const opacity = 0.35;
                  group.addShape('polygon', {
                    attrs: {
                      points: nodesToDraw
                        .slice(0, nodesToDraw.length - 1) // 这行是为了不让tempPoint也参与到画多边形，可以注释后查看没有这行的效果。
                        .map(node => {
                          return [node.x, node.y];
                        }),
                      fill: `rgba(0,112,204, ${opacity})`,
                    },
                  });
                }
              });
            }
          }

          return group;
        },
      });
      that.g6Instance = new G6.Graph({
        // 这个是依附的container，也是onMouseMove和onMouseMove事件绑定的div
        container: ref.current,
        width: canvasData.width,
        height: canvasData.height,
        nodeStateStyles: { hover: { fill: 'red' } },

        defaultNode: {
          size: 6,
          style: {
            stroke: '#0070CC',
            lineWidth: 2,
          },
        },
        // 每条边都是一个custom-edge'。
        defaultEdge: {
          // style: {
          //   stroke: '#E9E9E9',
          // },
          shape: 'custom-edge',
        },
        modes: { default: disabled ? [] : ['drag-node'] },
      });
      that.g6Instance.changeSize(canvasData.width, canvasData.height);
      that.g6Instance.data(g6Data);
      that.g6Instance.render();
    } else {
      that.g6Instance.changeSize(canvasData.width, canvasData.height);
      that.g6Instance.changeData(g6Data);
      setTimeout(() => {
        that.g6Instance.refresh();
        that.g6Instance.refreshPositions();
        that.g6Instance.paint();
      }, 2000);
    }
  }, [canvasData.height, canvasData.width, disabled, g6Data, that.g6Instance]);

  // 添加hover状态
  useEffect(() => {
    that.g6Instance.on('node:mouseenter', e => {
      if (disabled) return;
      const nodeItem = e.item;
      that.g6Instance.setItemState(nodeItem.getModel().id, 'hover', true);
    });
    that.g6Instance.on('node:mouseleave', e => {
      if (disabled) return;
      const nodeItem = e.item;
      that.g6Instance.setItemState(nodeItem.getModel().id, 'hover', false);
    });
    that.g6Instance.on('mousemove', () => {
      if (disabled) return;
      if (that.nextCurrentRegion) {
        dispatch({
          type: 'canvas/saveCurrentScenariosRegion',
          payload: that.nextCurrentRegion,
        });
        that.nextCurrentRegion = undefined;
      }
    });
    that.g6Instance.on('drag', e => {
      if (disabled) return;
      that.isDraggingNode = true;
      const dragNodeId = e?.item?.getModel?.()?.id;
      const dragNodeOrigData = flatten(currentRegion).find(
        v => v.id === dragNodeId,
      );
      const dragNodeX = dragNodeOrigData?.x;
      const dragNodeY = dragNodeOrigData?.y;

      const origX = e.canvasX;
      const origY = e.canvasY;
      const x = origX / canvasData?.width;
      const y = origY / canvasData?.height;

      const nextCurrentRegion = map(currentRegion, v => {
        return map(v, v2 => {
          if (v2.x === dragNodeX && v2.y === dragNodeY) {
            return { ...v2, x, y };
          }
          return v2;
        });
      });
      that.nextCurrentRegion = nextCurrentRegion;
    });
  }, [
    canvasData,
    currentRegion,
    disabled,
    dispatch,
    that.g6Instance,
    that.isDraggingNode,
    that.nextCurrentRegion,
  ]);

  // Div的mouseDown事件
  const onMouseUp = ({ target, pageX, pageY }) => {
    if (disabled || that.isDraggingNode) {
      that.isDraggingNode = false;
      return;
    }
    const actualLeft = getElementLeft(target); // 鼠标按下的点距离页面原点（页面左上角）的距离S
    const actualTop = getElementTop(target);
    const origX = pageX - actualLeft + layoutScrollLeft; // 点距离div原点（div左上角）的距离
    const origY = pageY - actualTop + layoutScrollTop;
    const x = origX / canvasData?.width; // 百分比
    const y = origY / canvasData?.height;

    // 把currentRegion存到redux
    let nextCurrentRegion;
    if (!tempPoint) {
      nextCurrentRegion = currentRegion?.concat?.([
        [{ x, y, id: `node_${nodeIndex}` }],
      ]);
    } else {
      nextCurrentRegion = map(currentRegion, (v, vIndex) => {
        if (vIndex === currentRegion.length - 1) {
          return map(v, (v2, v2Index) => {
            if (v2Index === v.length - 1) {
              return { ...v2, type: undefined };
            }
            return v2;
          });
        }
        return v;
      });
    }
    if (justFinishAPolygon) {
      nextCurrentRegion = nextCurrentRegion?.concat?.([]);
    }

    dispatch({
      type: 'canvas/saveCurrentScenariosRegion',
      payload: nextCurrentRegion,
    });
  };

  const onMouseMove = event => {
    // 如果没有tempPoint而且刚刚画完一个闭合的图形，或者根本还没开始画（画面上没有nodes），就return
    if (
      (justFinishAPolygon && !tempPoint) ||
      disabled ||
      g6Data?.nodes?.length === 0 ||
      that.isDraggingNode
    )
      return;
    if (that.nextCurrentRegion) {
      dispatch({
        type: 'canvas/saveCurrentScenariosRegion',
        payload: that.nextCurrentRegion,
      });
    }
    const actualLeft = getElementLeft(event.target);
    const actualTop = getElementTop(event.target);
    const origX = event?.pageX - actualLeft + layoutScrollLeft;
    const origY = event?.pageY - actualTop + layoutScrollTop;
    const x = origX / canvasData?.width;
    const y = origY / canvasData?.height;

    const radiusFromLastPoint = Math.sqrt(
      (origFirstDotOfCurrentRegionLastX - origX) ** 2 +
        (origFirstDotOfCurrentRegionLastY - origY) ** 2,
    );
    let nextPoint;
    if (radiusFromLastPoint < 30 && currentRegionLast?.length > 3) {
      nextPoint = {
        x: firstDotOfCurrentRegionLastX,
        y: firstDotOfCurrentRegionLastY,
        type: 'temp',
        id: tempPoint ? `node_${nodeIndex - 1}` : `node_${nodeIndex}`,
      };
    } else {
      nextPoint = {
        x,
        y,
        type: 'temp',
        id: tempPoint ? `node_${nodeIndex - 1}` : `node_${nodeIndex}`,
      };
    }

    // 把currentRegion存到redux
    if (!tempPoint) {
      const nextCurrentRegion = map(currentRegion, (v, vIndex) => {
        if (vIndex === currentRegion.length - 1) {
          return v.concat([nextPoint]);
        }
        return v;
      });
      dispatch({
        type: 'canvas/saveCurrentScenariosRegion',
        payload: nextCurrentRegion,
      });
    } else {
      const nextCurrentRegion = map(currentRegion, (v, vIndex) => {
        if (vIndex === currentRegion.length - 1) {
          return v.map((v2, v2Index) => {
            if (v2Index === v.length - 1) {
              return nextPoint;
            }
            return v2;
          });
        }
        return v;
      });
      dispatch({
        type: 'canvas/saveCurrentScenariosRegion',
        payload: nextCurrentRegion,
      });
    }
  };

  // 在mask上画图
  const canvasRef = useRef(null);

  return (
    <>
      <div
        style={{ lineHeight: '0px' }}
        role="button"
        aria-label="canvas"
        onMouseUp={event => {
          onMouseUp({
            target: event.target,
            pageX: event?.pageX,
            pageY: event?.pageY,
          });
        }}
        onMouseMove={onMouseMove}
        // onMouseMove={event => requestAnimationFrame(timestamp => onMouseMove(timestamp, event))}
        className={cx('MyCanvas')}
        ref={ref}
      />
      {disabled && (
        <canvas
          ref={canvasRef}
          width={canvasData.width}
          height={canvasData.height}
          className={cx('canvas-mask')}
          onClick={() => {
            if (!isEdit) return;
            if (!formUtils.queryValue(get(currentScenario, 'scenario'))) {
              message.warning('请选择使用场景');
              return;
            }
            if (
              formUtils.queryValue(get(currentScenario, 'affect')) !==
                'inside' ||
              formUtils.queryValue(get(currentScenario, 'affect')) !== 'outside'
            ) {
              message.warning(
                '请选择"框选区域内检测"或"框选区域外检测",再进行框选区域',
              );
            }
          }}
        />
      )}
    </>
  );
};

export default connect(({ canvas }) => {
  const currentScenarioId = get(canvas, 'currentScenarioId');
  const scenarios = get(canvas, 'scenarios');
  const currentScenario = find(scenarios, v => v.id === currentScenarioId);
  const currentRegion = get(currentScenario, 'regions') || [];

  const currentRegionLast = get(
    currentRegion,
    `[${get(currentRegion, 'length') - 1}]`,
  );
  const tempPoint = find(currentRegionLast, v => v.type === 'temp');
  const canvasData = get(canvas, 'canvasData');

  const firstDotOfCurrentRegionLast = get(currentRegionLast, '[0]');
  const firstDotOfCurrentRegionLastX = firstDotOfCurrentRegionLast?.x;
  const firstDotOfCurrentRegionLastY = firstDotOfCurrentRegionLast?.y;

  const lastDotOfCurrentRegionLast =
    currentRegionLast?.[currentRegionLast.length - 1];
  const lastDotOfCurrentRegionLastX = lastDotOfCurrentRegionLast?.x;
  const lastDotOfCurrentRegionLastY = lastDotOfCurrentRegionLast?.y;
  const origFirstDotOfCurrentRegionLastX =
    firstDotOfCurrentRegionLastX * canvasData?.width;
  const origFirstDotOfCurrentRegionLastY =
    firstDotOfCurrentRegionLastY * canvasData?.height;
  const justFinishAPolygon =
    firstDotOfCurrentRegionLastX === lastDotOfCurrentRegionLastX &&
    firstDotOfCurrentRegionLastY === lastDotOfCurrentRegionLastY &&
    currentRegionLast?.length > 2;

  const nodeIndex = flatten(currentRegion).length;

  return {
    canvasData,
    currentScenario,
    drawData: canvas?.drawData,
    scenarios,
    layoutScrollTop: canvas.layoutScrollTop,
    layoutScrollLeft: canvas.layoutScrollLeft,
    // g6Data: canvas.g6Data, // 没有用到model里面的g6Data，把他放到useState里面了
    currentRegion,
    currentRegionLast,
    tempPoint,
    firstDotOfCurrentRegionLast,
    firstDotOfCurrentRegionLastX,
    firstDotOfCurrentRegionLastY,
    origFirstDotOfCurrentRegionLastX,
    origFirstDotOfCurrentRegionLastY,

    justFinishAPolygon,
    nodeIndex,
    currentScenarioId: canvas.currentScenarioId,
  };
})(MyCanvas);

MyCanvas.propTypes = {
  layoutScrollTop: PropTypes.number,
  layoutScrollLeft: PropTypes.number,
  disabled: PropTypes.bool,
  currentRegion: PropTypes.arrayOf(PropTypes.array),
  currentRegionLast: PropTypes.arrayOf(PropTypes.object),
  tempPoint: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  firstDotOfCurrentRegionLastX: PropTypes.number,
  firstDotOfCurrentRegionLastY: PropTypes.number,
  origFirstDotOfCurrentRegionLastX: PropTypes.number,
  origFirstDotOfCurrentRegionLastY: PropTypes.number,

  justFinishAPolygon: PropTypes.bool,
  nodeIndex: PropTypes.number,
  canvasData: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  currentScenario: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  ),
  isEdit: PropTypes.bool,
  dispatch: PropTypes.func,
};

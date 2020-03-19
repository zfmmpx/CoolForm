import { map, cloneDeep, find, set } from 'lodash-es';
import uuid from 'uuid';
import formUtils from '@/common/formUtils';
import { history } from 'cool-utils';

// const delay = timeout =>
//   new Promise(resolve => {
//     setTimeout(resolve, timeout);
//   });

const defaultCurrentScenarioId = uuid();
export default {
  namespace: 'canvas',
  state: {
    imgData: {
      src: '',
      width: 0,
      height: undefined,
    },
    canvasData: {
      width: window.innerWidth,
      height: window.innerHeight,
      // width: 800,
      // height: 800,
    },
    scenarios: [
      {
        id: defaultCurrentScenarioId,
        regions: [],
      },
    ],
    g6Data: {
      nodes: [],
      edges: [],
    },
    currentScenarioId: defaultCurrentScenarioId,
    layoutScrollTop: 0,
    layoutScrollLeft: 0,
    forms: [],
    isPull: false,
    hasError: [],
    blobObj: {},
  },

  subscriptions: {},

  effects: {
    *saveScreenshot({ payload }, { put, select }) {
      const { id } = history.location.query;
      const addParams = yield select(({ archives }) => archives.addParams);

      yield put({ type: 'saveScreenshotReducer', payload: payload.base64 });
      const obj = { id: addParams.id || id, file: payload.blob };

      yield put({
        type: 'saveScreenshotReducerBlob',
        payload: obj,
      });
    },
  },

  reducers: {
    // 设置是否已经拉流
    setIsPull(state, action) {
      return {
        ...state,
        isPull: action.payload,
      };
    },
    // 比如重新拉chrome宽高的时候，可以用这个reducer去设定canvas的宽高
    saveCanvasData(state, action) {
      const { payload } = action;
      return {
        ...state,
        canvasData: {
          ...state.canvasData,
          ...payload,
        },
      };
    },
    preStep(state) {
      const currentScenarioId = state?.currentScenarioId;
      return {
        ...state,
        scenarios: state.scenarios.map(v => {
          if (v.id === currentScenarioId) {
            return {
              ...v,
              regions: v.regions.slice(0, v.regions?.length - 1),
            };
          }
          return v;
        }),
      };
    },
    deleteCurrentRegion(state) {
      const currentScenarioId = state?.currentScenarioId;
      return {
        ...state,
        scenarios: state.scenarios.map(v => {
          if (v.id === currentScenarioId) {
            return {
              ...v,
              regions: [],
            };
          }
          return v;
        }),
      };
    },
    deleteCurrentUncompletedRegion(state) {
      const currentScenarioId = state?.currentScenarioId;
      return {
        ...state,
        scenarios: state.scenarios.map(v => {
          if (v.id === currentScenarioId) {
            return {
              ...v,
              regions: v.regions.filter(
                v2 => v2[v2.length - 1].type !== 'temp',
              ),
            };
          }
          return v;
        }),
      };
    },
    // 保存当前Scenario的id
    saveCurrentScenarioId(state, action) {
      const currentScenarioId = action.payload;
      return {
        ...state,
        currentScenarioId,
      };
    },
    // 保存当前ScenarioId代表的Scenario的数据
    saveCurrentScenariosRegion(state, action) {
      const regions = action.payload;
      const { currentScenarioId } = state;
      return {
        ...state,
        scenarios: map(state.scenarios, v => {
          if (v.id === currentScenarioId) {
            return {
              ...v,
              regions,
            };
          }
          return v;
        }),
      };
    },
    // 保存Scenarios下拉框的值
    saveScenarios(state, action) {
      const { name, value, id, saveName } = action.payload;
      const nextObjectToChange = cloneDeep(state[name]);
      set(find(nextObjectToChange, { id }), saveName, value);

      return {
        ...state,
        [name]: nextObjectToChange,
      };
    },
    // 保存Affect checkbox group的值
    saveAffect(state, action) {
      const { name, value, id, saveName } = action.payload;
      const nextObjectToChange = cloneDeep(state[name]);
      set(find(nextObjectToChange, { id }), saveName, value);

      return {
        ...state,
        [name]: nextObjectToChange,
      };
    },
    // 全选区域
    drawWholdArea(state) {
      const { currentScenarioId } = state;
      return {
        ...state,
        scenarios: state.scenarios.map(v => {
          if (v.id === currentScenarioId)
            return {
              ...v,
              regions: [
                [
                  { x: 0, y: 0 },
                  { x: 1, y: 0 },
                  { x: 1, y: 1 },
                  { x: 0, y: 1 },
                  { x: 0, y: 0 },
                ],
              ],
            };
          return v;
        }),
      };
    },
    // 加一个Scenarios
    addScenarios(state) {
      const id = uuid();
      return {
        ...state,
        scenarios: state.scenarios.concat({
          id,
          // scenario: null,
          // affect: null,
          regions: [],
        }),
        currentScenarioId: id,
      };
    },
    // 删除Scenarios
    deleteScenarios(state, action) {
      const id = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.filter(v => v.id !== id),
      };
    },
    // 从后台接到数据之后，把JSON字符串转为我们能用的数据
    setScenarios(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    // 重置数据
    resetCanvas(state) {
      const nextCurrentScenarioId = uuid();
      return {
        ...state,
        imgData: {
          src: '',
          width: 0,
          height: undefined,
        },
        canvasData: {
          width: 0,
          height: 0,
        },
        scenarios: [
          {
            id: nextCurrentScenarioId,
            regions: [],
          },
        ],
        currentScenarioId: nextCurrentScenarioId,
        layoutScrollTop: 0,
        layoutScrollLeft: 0,
        forms: [],
        isPull: false,
        hasError: [],
      };
    },
    registerForm(state, action) {
      const { forms } = state;
      const { form, formId } = action.payload;
      const orginForms = formUtils.registerForm(forms, form, formId);
      return {
        ...state,
        forms: orginForms,
      };
    },
    unRegisterForm(state, action) {
      const { forms } = state;
      const { form, formId } = action.payload;
      const orginForms = formUtils.unRegisterForm(forms, form, formId);
      return {
        ...state,
        forms: orginForms,
      };
    },
    // 保存图片数据：宽高 src
    saveImgData(state, action) {
      const { payload } = action;
      return {
        ...state,
        imgData: {
          ...state.imgData,
          ...payload,
        },
      };
    },
    // 保存截图base64
    saveScreenshotReducer(state, action) {
      return {
        ...state,
        imgData: {
          ...state.imgData,
          src: action.payload,
        },
      };
    },
    // 保存二进制格式的图片
    saveScreenshotReducerBlob(state, action) {
      return {
        ...state,
        blobObj: action.payload,
      };
    },
    save(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
};

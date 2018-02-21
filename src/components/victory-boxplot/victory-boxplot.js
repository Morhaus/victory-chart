import PropTypes from "prop-types";
import React from "react";
import BoxHelpers from "./helper-methods";
import { partialRight } from "lodash";
import {
  Helpers, VictoryLabel, VictoryContainer, PropTypes as CustomPropTypes,
  VictoryTheme, Bar, addEvents, Data, Domain
} from "victory-core";
import { BaseProps, DataProps } from "../../helpers/common-props";

const fallbackProps = {
  width: 450,
  height: 300,
  padding: 50
};

const defaultData = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 3 },
  { x: 4, y: 4 }
];

const animationWhitelist = ["data", "domain", "height", "padding", "style", "width"];

class VictoryBoxPlot extends React.Component {
  static displayName = "VictoryBoxPlot";

  static role = "boxPlot";

  static propTypes = {
    ...BaseProps,
    ...DataProps,
    max: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    maxComponent: PropTypes.element,
    maxLabelComponent: PropTypes.element,
    median: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    medianComponent: PropTypes.element,
    medianLabelComponent: PropTypes.element,
    min: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    minComponent: PropTypes.element,
    minLabelComponent: PropTypes.element,
    q1: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    q1Component: PropTypes.element,
    q1LabelComponent: PropTypes.element,
    q3: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    q3Component: PropTypes.element,
    q3LabelComponent: PropTypes.element,
    style: PropTypes.shape({
      parent: PropTypes.object, labels: PropTypes.object,
      max: PropTypes.object, maxLabels: PropTypes.object,
      median: PropTypes.object, medianLabels: PropTypes.object,
      min: PropTypes.object, minLabels: PropTypes.object,
      q1: PropTypes.object, q1Labels: PropTypes.object,
      q3: PropTypes.object, q3Labels: PropTypes.object
    })

  };

  static defaultProps = {
    containerComponent: <VictoryContainer/>,
    data: defaultData,
    dataComponent: <Bar/>,
    groupComponent: <g role="presentation"/>,
    labelComponent: <VictoryLabel/>,
    samples: 50,
    scale: "linear",
    sortOrder: "ascending",
    standalone: true,
    theme: VictoryTheme.grayscale
  };

  static getDomain = Domain.getDomainWithZero.bind(Domain);
  static getData = Data.getData.bind(Data);
  static getBaseProps = partialRight(BoxHelpers.getBaseProps.bind(BoxHelpers), fallbackProps);
  static expectedComponents = [
    "dataComponent", "labelComponent", "groupComponent", "containerComponent"
  ];

  // Overridden in native versions
  shouldAnimate() {
    return !!this.props.animate;
  }

  render() {
    const { role } = this.constructor;
    const props = Helpers.modifyProps((this.props), fallbackProps, role);
    if (this.shouldAnimate()) {
      return this.animateComponent(props, animationWhitelist);
    }
    const children = this.renderData(props);
    return props.standalone ? this.renderContainer(props.containerComponent, children) : children;
  }
}

export default addEvents(VictoryBoxPlot);

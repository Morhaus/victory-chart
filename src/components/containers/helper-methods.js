import { Selection, Collection } from "victory-core";
import { assign } from "lodash";

export default {
   /**
   * Generates a new domain scaled by factor and constrained by the original domain.
   * @param  {[Number, Number]} currentDomain  The domain to be scaled.
   * @param  {[Number, Number]} originalDomain The original domain for the data set.
   * @param  {Number}           factor         The delta to translate by
   * @return {[Number, Number]}                The scale domain
   */
  scale(currentDomain, originalDomain, factor) {
    const [fromBound, toBound] = originalDomain;
    const [from, to] = currentDomain;
    const range = Math.abs(from - to);
    const midpoint = +from + (range / 2);
    const newRange = (range * factor) / 2;
    return [
      Collection.getMaxValue([midpoint - newRange, fromBound]),
      Collection.getMinValue([midpoint + newRange, toBound])
    ];
  },

/**
 * Generate a new domain translated by the delta and constrained by the original domain.
 * @param  {[Number, Number]} currentDomain  The domain to be translated.
 * @param  {[Number, Number]} originalDomain The original domain for the data set.
 * @param  {Number}           delta          The delta to translate by
 * @return {[Number, Number]}                The translated domain
 */
  pan(currentDomain, originalDomain, delta) {
    const [fromCurrent, toCurrent] = currentDomain.map((val) => +val);
    const [fromOriginal, toOriginal] = originalDomain.map((val) => +val);
    const lowerBound = fromCurrent + delta;
    const upperBound = toCurrent + delta;
    let newDomain;
    if (lowerBound > fromOriginal && upperBound < toOriginal) {
      newDomain = [lowerBound, upperBound];
    } else if (lowerBound < fromOriginal) { // Clamp to lower limit
      const dx = toCurrent - fromCurrent;
      newDomain = [fromOriginal, fromOriginal + dx];
    } else if (upperBound > toOriginal) { // Clamp to upper limit
      const dx = toCurrent - fromCurrent;
      newDomain = [toOriginal - dx, toOriginal];
    } else {
      newDomain = currentDomain;
    }
    return Collection.containsDates(currentDomain) || Collection.containsDates(originalDomain) ?
      newDomain.map((val) => new Date(val)) : newDomain;
  },


  getDomainScale(domain, scale) {
    const {x: [from, to]} = domain;
    const rangeX = scale.x.range();
    const plottableWidth = Math.abs(rangeX[0] - rangeX[1]);
    return plottableWidth / (to - from);
  },

  getOriginalDomain(scale) {
    return {
      x: scale.x.domain(),
      y: scale.y.domain()
    };
  },

  withinBounds(point, bounds, padding) {
    const {x1, x2, y1, y2} = bounds;
    const {x, y} = point;
    padding = padding ? padding / 2 : 0;
    return x + padding >= Math.min(x1, x2) &&
      x - padding <= Math.max(x1, x2) &&
      y + padding >= Math.min(y1, y2) &&
      y - padding <= Math.max(y1, y2);
  },

  getDomainBox(props, fullDomain, selectedDomain) {
    const { dimension, scale, domain } = props;
    fullDomain = fullDomain || domain || this.getOriginalDomain(props);
    selectedDomain = selectedDomain || fullDomain;
    const fullCoordinates = Selection.getDomainCoordinates(scale, fullDomain);
    const selectedCoordinates = Selection.getDomainCoordinates(scale, selectedDomain);

    return {
      x1: dimension !== "y" ? Math.min(...selectedCoordinates.x) : Math.min(...fullCoordinates.x),
      x2: dimension !== "y" ? Math.max(...selectedCoordinates.x) : Math.max(...fullCoordinates.x),
      y1: dimension !== "x" ? Math.min(...selectedCoordinates.y) : Math.min(...fullCoordinates.y),
      y2: dimension !== "x" ? Math.max(...selectedCoordinates.y) : Math.max(...fullCoordinates.y)
    };
  },

  getHandles(props, domainBox) {
    const {x1, x2, y1, y2} = domainBox;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const handleWidth = props.handleWidth / 2;
    return {
      left: {x1: minX - handleWidth, x2: minX + handleWidth, y1, y2},
      right: {x1: maxX - handleWidth, x2: maxX + handleWidth, y1, y2},
      top: {x1, x2, y1: minY + handleWidth, y2: minY - handleWidth},
      bottom: {x1, x2, y1: maxY + handleWidth, y2: maxY - handleWidth}
    };
  },

  getActiveHandles(point, props, domainBox) {
    const handles = this.getHandles(props, domainBox);
    const options = ["top", "bottom", "left", "right"];
    const activeHandles = options.reduce((memo, opt) => {
      memo = this.withinBounds(point, handles[opt]) ? memo.concat(opt) : memo;
      return memo;
    }, []);
    return activeHandles.length && activeHandles;
  },

  getResizeMutation(box, handles) {
    const {x1, y1, x2, y2} = box;
    const mutations = {
      left: {x1: Math.max(x1, x2), x2: Math.min(x1, x2), y1, y2},
      right: {x1: Math.min(x1, x2), x2: Math.max(x1, x2), y1, y2},
      top: {y1: Math.max(y1, y2), y2: Math.min(y1, y2), x1, x2},
      bottom: {y1: Math.min(y1, y2), y2: Math.max(y1, y2), x1, x2}
    };
    return handles.reduce((memo, current) => {
      return assign(memo, mutations[current]);
    }, {});
  },

  getMinimumDomain() {
    return {x: [0, 1 / Number.MAX_SAFE_INTEGER], y: [0, 1 / Number.MAX_SAFE_INTEGER]};
  },

  getSelectionMutation(point, box, dimension) {
    const {x, y} = point;
    const {x1, x2, y1, y2} = box;
    return {
      x1: dimension !== "y" ? x : x1,
      y1: dimension !== "x" ? y : y1,
      x2: dimension !== "y" ? x : x2,
      y2: dimension !== "x" ? y : y2
    };
  },

  panBox(props, point) {
    const {fullDomain, selectedDomain, dimension, startX, startY} = props;
    const {x1, x2, y1, y2} = props.x1 ?
      props : this.getDomainBox(props, fullDomain, selectedDomain);

    const {x, y} = point;
    const delta = {
      x: startX ? startX - x : 0,
      y: startY ? startY - y : 0
    };
    return {
      x1: dimension !== "y" ? Math.min(x1, x2) - delta.x : Math.min(x1, x2),
      x2: dimension !== "y" ? Math.max(x1, x2) - delta.x : Math.max(x1, x2),
      y1: dimension !== "x" ? Math.min(y1, y2) - delta.y : Math.min(y1, y2),
      y2: dimension !== "x" ? Math.max(y1, y2) - delta.y : Math.max(y1, y2)
    };
  },

  constrainBox(box, fullDomainBox) {
    const {x1, y1, x2, y2} = fullDomainBox;
    return {
      x1: box.x2 > x2 ? x2 - Math.abs(box.x2 - box.x1) : Math.max(box.x1, x1),
      y1: box.y2 > y2 ? y2 - Math.abs(box.y2 - box.y1) : Math.max(box.y1, y1),
      x2: box.x1 < x1 ? x1 + Math.abs(box.x2 - box.x1) : Math.min(box.x2, x2),
      y2: box.y1 < y1 ? y1 + Math.abs(box.y2 - box.y1) : Math.min(box.y2, y2)
    };
  }
};

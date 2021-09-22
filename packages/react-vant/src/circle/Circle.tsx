import React, { CSSProperties, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { CircleProps, CircleStartPosition } from './PropsType';
import { createNamespace, isObject, getSizeStyle } from '../utils';
import { cancelRaf, raf } from '../utils/raf';

const [bem] = createNamespace('circle');

let uid = 0;

function format(rate: string | number) {
  return Math.min(Math.max(+rate, 0), 100);
}

function getPath(clockwise: boolean, viewBoxSize: number) {
  const sweepFlag = clockwise ? 1 : 0;
  return `M ${viewBoxSize / 2} ${
    viewBoxSize / 2
  } m 0, -500 a 500, 500 0 1, ${sweepFlag} 0, 1000 a 500, 500 0 1, ${sweepFlag} 0, -1000`;
}

const ROTATE_ANGLE_MAP: Record<CircleStartPosition, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

const Circle: React.FC<CircleProps> = (props) => {
  // eslint-disable-next-line no-plusplus
  const id = `van-circle-${uid++}`;

  const viewBoxSize = useMemo(() => +props.strokeWidth + 1000, [props.strokeWidth]);

  const path = useMemo(() => getPath(props.clockwise, viewBoxSize), [props.clockwise, viewBoxSize]);

  const svgStyle = useMemo(() => {
    const angleValue = ROTATE_ANGLE_MAP[props.startPosition];
    if (angleValue) {
      return {
        transform: `rotate(${angleValue}deg)`,
      };
    }
    return undefined;
  }, [props.startPosition]);

  useEffect(() => {
    let rafId: number | undefined;
    const startTime = Date.now();
    const startRate = props.currentRate;
    const endRate = format(props.rate);
    const duration = Math.abs(((startRate - endRate) * 1000) / +props.speed);

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const rate = progress * (endRate - startRate) + startRate;

      props.onChange?.(format(parseFloat(rate.toFixed(1))));

      if (endRate > startRate ? rate < endRate : rate > endRate) {
        rafId = raf(animate);
      }
    };
    if (props.speed) {
      if (rafId) {
        cancelRaf(rafId);
      }
      rafId = raf(animate);
    } else {
      props.onChange?.(endRate);
    }
  }, [props.rate]);

  const renderHover = () => {
    const PERIMETER = 3140;
    const { strokeWidth, currentRate } = props;
    const offset = (PERIMETER * currentRate) / 100;
    const color = isObject(props.color) ? `url(#${id})` : props.color;

    const style: CSSProperties = {
      stroke: color,
      strokeWidth: `${+strokeWidth + 1}px`,
      strokeLinecap: props.strokeLinecap,
      strokeDasharray: `${offset}px ${PERIMETER}px`,
    };

    return <path d={path} style={style} className={classnames(bem('hover'))} stroke={color} />;
  };

  const renderLayer = () => {
    const style = {
      fill: props.fill,
      stroke: props.layerColor,
      strokeWidth: `${props.strokeWidth}px`,
    };

    return <path className={classnames(bem('layer'))} style={style} d={path} />;
  };

  const renderGradient = () => {
    const { color } = props;

    if (!isObject(color)) {
      return null;
    }

    const Stops = Object.keys(color)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      // eslint-disable-next-line react/no-array-index-key
      .map((key, index) => <stop key={index} offset={key} stopColor={color[key]} />);

    return (
      <defs>
        <linearGradient id={id} x1="100%" y1="0%" x2="0%" y2="0%">
          {Stops}
        </linearGradient>
      </defs>
    );
  };

  const renderText = () => {
    if (props.text) {
      return <div className={classnames(bem('text'))}>{props.text}</div>;
    }
    return props.children;
  };

  return (
    <div
      className={classnames(bem(), props.className)}
      style={{ ...props.style, ...getSizeStyle(props.size) }}
    >
      <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} style={svgStyle}>
        {renderGradient()}
        {renderLayer()}
        {renderHover()}
      </svg>
      {renderText()}
    </div>
  );
};

Circle.defaultProps = {
  clockwise: true,
  currentRate: 0,
  speed: 100,
  fill: 'none',
  rate: 100,
  strokeWidth: 40,
  startPosition: 'top',
};

export default Circle;
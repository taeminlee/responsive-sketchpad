// @flow

declare type Point = {
  x: number,
  y: number,
};

declare type Segment = {
  points: Point[],
  circle?: boolean
}

declare type Path = {
  points: Point[],

}

declare type Stroke = {
  segments: Segment[],
  color: string,
  size: number,
  cap: string,
  join: string,
  miterLimit: number,
};

const TOOL = {
  FREE: 0,
  LINE: 1,
  RECTANGLE: 2,
  TRIANGLE: 3,
  DIAMOND: 4,
  CIRCLE: 5,
}

type Tool = 0|1|2|3|4|5;


class Sketchpad {
  el: HTMLElement;
  opts: {
    width: number,
    height: number,
    autoResize?: boolean,
    onDraw?: (Stroke[]) => void
  };

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  sketching: boolean;
  strokes: Stroke[];
  undos: Stroke[];

  _aspectRatio: number
  tool: Tool;
  lineColor: string;

  constructor(el: HTMLElement, opts) {
    this.el = el;
    this.opts = Object.assign({}, {
      width: el.clientWidth,
      height: el.clientWidth,
      autoResize: true,
      onDraw: null,
    }, opts);

    this.sketching = false;
    this.lineColor = '#000000';
    this.tool = TOOL.FREE;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('unselectable', 'on');
    el.appendChild(this.canvas);

    this.context = ((this.canvas.getContext('2d'): any): CanvasRenderingContext2D);

    this.strokes = [];
    this.undos = [];

    this._aspectRatio = this.opts.width / this.opts.height;
    this.resize(this.opts.width);

    // Mouse Event Listeners
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => this._startLine(e));
    this.canvas.addEventListener('mouseenter', (e: MouseEvent) => this._drawLine(e));
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => this._drawLine(e));
    this.canvas.addEventListener('mouseup', (e: MouseEvent) => this._drawLine(e));
    this.canvas.addEventListener('mouseleave', (e: MouseEvent) => this._drawLine(e));

    // if (document.body) {
    //   let body = document.body;
    //   body.addEventListener('mouseup', (e: MouseEvent) => this._endLine(e));
    //   body.addEventListener('touchend', (e: TouchEvent) => this._endLine(e));
    // }

    // Touch Event Listeners
    this.canvas.addEventListener('touchstart', (e: TouchEvent) => this._startLine(e));
    this.canvas.addEventListener('touchmove', (e: TouchEvent) => this._drawLine(e));

    if (this.opts.autoResize) {
      window.addEventListener('resize', (e) => this.resize(this.el.clientWidth));
    }
  }

  _getCursorRelativeToCanvas(e: MouseEvent|TouchEvent): Point {
    let point: Point = {x: 1, y: 2};
    if ('ontouchstart' in window && e instanceof TouchEvent) {
      e = ((e: any): TouchEvent)
      return {
        x: (e.touches[0].pageX - this.canvas.offsetLeft) / this.canvas.width,
        y: (e.touches[0].pageY - this.canvas.offsetTop) / this.canvas.height
      }
    } else {
      e = ((e: any): MouseEvent);
      let rect = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / this.canvas.width,
        y: (e.clientY - rect.top) / this.canvas.height,
      }
    }
  }

  _normalizePoint(point: Point): Point {
    return {
      x: point.x * this.canvas.width,
      y: point.y * this.canvas.height
    }
  }

  _startLine(e: MouseEvent|TouchEvent) {
    e.preventDefault();
    if (e.type == 'mouseenter' && !this.sketching) return;

    let body = document.body;
    if (body) {
      body.addEventListener('mouseup', (e: MouseEvent) => this._endLine(e));
      body.addEventListener('touchend', (e: TouchEvent) => this._endLine(e));
    }

    this.sketching = true;

    let point = this._getCursorRelativeToCanvas(e);
    let stroke: Stroke = {
      segments: [{points: [point]}],
      color: this.lineColor,
      size: 5,
      cap: 'round',
      join: 'round',
      miterLimit: 10,
    };

    this.strokes.push(stroke);
  }

  _drawLine(e: MouseEvent|TouchEvent) {
    e.preventDefault();
    if (!this.sketching) return;

    let point = this._getCursorRelativeToCanvas(e);

    let stroke = this.strokes[this.strokes.length - 1];
    if (e.type == 'mouseenter') {
      stroke.segments.push({points: []});
    }

    let segment = stroke.segments[stroke.segments.length - 1];
    let firstPoint = segment.points[0];

    if (this.tool == TOOL.FREE) {
      segment.points.push(point);
    } else if (this.tool == TOOL.LINE) {
      segment.points = [firstPoint, point];
    } else if (this.tool == TOOL.RECTANGLE) {
      segment.points = [
        firstPoint,
        {x: point.x, y: firstPoint.y},
        point,
        {x: firstPoint.x, y: point.y},
        firstPoint
      ]
    } else if (this.tool == TOOL.TRIANGLE) {
      segment.points = [
        firstPoint,
        {x: (point.x + firstPoint.x)/ 2, y: point.y},
        {x: point.x, y: firstPoint.y},
        firstPoint,
      ];
    } else if (this.tool == TOOL.DIAMOND) {
      segment.points = [
        firstPoint,
        {x: (point.x + firstPoint.x)/ 2, y: point.y},
        {x: point.x, y: firstPoint.y},
        {x: (point.x + firstPoint.x)/ 2, y: 2 * firstPoint.y - point.y},
        firstPoint,
      ];
    } else if (this.tool == TOOL.CIRCLE) {
      segment.points = [firstPoint, point];
      segment.circle = true;
    }

    stroke.segments[stroke.segments.length - 1] = segment;
    this.redraw();
    if (this.opts.onDraw) {
      this.opts.onDraw(this.strokes);
    }
  }

  _endLine(e: MouseEvent|TouchEvent) {
    e.preventDefault();
    this.sketching = false;
  }

  _drawStroke(stroke: Stroke) {
    this.context.beginPath();

    for (var i = 0; i < stroke.segments.length; i++) {
      let segment = stroke.segments[i];
      for (var j = 0; j < segment.points.length - 1; j++) {
        let start = this._normalizePoint(segment.points[j]);
        let end = this._normalizePoint(segment.points[j + 1]);

        if (segment.circle) {
          let a = start.x - end.x;
          let b = start.y - end.y;
          let radius = Math.sqrt((a * a) + (b * b))
          this.context.arc(start.x, start.y, radius, 0, 2 * Math.PI)
        } else {
          this.context.moveTo(start.x, start.y);
          this.context.lineTo(end.x, end.y);
        }
      }
    }

    this.context.strokeStyle = stroke.color;
    this.context.lineWidth = stroke.size;
    this.context.lineJoin = stroke.join;
    this.context.lineCap = stroke.cap;
    this.context.miterLimit = stroke.miterLimit;
    this.context.stroke();
  }

  /**
  * Set the tool to use to draw
  */
  setTool(tool: Tool) {
    this.tool = tool;
  }

  /**
  * Set the color of the strokes
  */
  setLineColor(color: string) {
    this.lineColor = color;
  }

  /**
  * Resize the canvas
  * Maintains existing aspect ratio to calculate height
  */
  resize(width: number) {
    this.canvas.setAttribute('width', width.toString());
    let height = width * this._aspectRatio;
    this.canvas.setAttribute('height', height.toString());
    this.redraw();
  }

  /**
  * Undo the last stroke
  */
  undo() {
    let stroke = this.strokes.pop();
    if (stroke) {
      this.undos.push(stroke);
      this.redraw();
    }
  }

  /**
  * Redo the last undo
  */
  redo() {
    let stroke = this.undos.pop();
    if (stroke) {
      this.strokes.push(stroke);
      this.redraw();
    }
  }

  /**
  * Clear the canvas
  */
  clear() {
    this.strokes = [];
    this.undos = [];
    this.redraw();
  }

  /**
  * Redraw the canvas
  */
  redraw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var i = 0; i < this.strokes.length; i++) {
      this._drawStroke(this.strokes[i]);
    }
  }
}


class Shape {
  start: Point;
}


class Line extends Shape {
  end: Point
}

class Rectangle extends Shape {
  end: Point
}

cla

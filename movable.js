// 生成 movable 函数
;(function() {
  // 确定使用鼠标事件还是触摸事件
  const touchable = 'ontouchstart' in window;
  const events = {
    movestart: touchable ? 'touchstart' : 'mousedown',
    move: touchable ? 'touchmove' : 'mousemove',
    moveend: touchable ? 'touchend' : 'mouseup',
  };

  // 节流函数，防止事件触发太频繁
  function throttle(fn) {
    let ticking = false;
    return function() {
      const args = [].slice.call(arguments);
      if (!ticking) {
        window.requestAnimationFrame(function() {
          fn.apply(null, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  // 绑定事件到 document
  function addEvent(event, fn) {
    document.addEventListener(event, fn);
  }

  // 从 document 解绑事件
  function removeEvent(event, fn) {
    document.removeEventListener(event, fn);
  }

  // 防止触发拖拽
  function preventDrag(e){
    e.stopPropagation();
    e.cancelBubble = true;
    if (! touchable) {
      e.preventDefault();
      e.returnValue = false;
    }
    return false;
  }

  function isMouseEvent(e) {
    return e instanceof MouseEvent;
  }

  function isTouchEvent(e) {
    return typeof TouchEvent != undefined && e instanceof TouchEvent;
  }

  function getEventPoint(e) {
    return isMouseEvent(e) ? e : (isTouchEvent(e) ? e.touches[0] : {});
  }

  /**
   * 拖动指定元素，并执行回调函数
   *
   * @param {Element} target 目标元素
   * @param {Function} onmove  移动回调
   */
  function movable(target, onmove) {
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }

    if (! target instanceof Element) {
      throw '必须指定目标元素';
    }

    if (typeof onmove != 'function') {
      target.style.position = 'fixed';
      onmove = function(point) {
        const rect = target.getBoundingClientRect();
        target.style.left = Math.min(Math.max(point.clientX - point.offsetX, 0), window.innerWidth - rect.width) + 'px';
        target.style.top = Math.min(Math.max(point.clientY - point.offsetY, 0), window.innerHeight - rect.height) + 'px';
      }
    }

    const offset = {};

    // 生成节流后的移动事件处理函数
    const handleMove = throttle(function(e) {
      preventDrag(e);
      const point = getEventPoint(e);
      onmove({
        target: e.target,
        clientX: point.clientX,
        clientY: point.clientY,
        pageX: point.pageX,
        pageY: point.pageY,
        screenX: point.screenX,
        screenY: point.screenY,
        offsetX: offset.x,
        offsetY: offset.y,
      });
    });

    // 停止拖动
    function handleStop() {
      removeEvent(events.move, handleMove);
      removeEvent(events.moveend, handleStop);
    }

    function handleStart(e) {
      if (e.target === target) {
        preventDrag(e);
        const rect = target.getBoundingClientRect();
        const point = getEventPoint(e);
        offset.x = point.clientX - rect.left;
        offset.y = point.clientY - rect.top;
        addEvent(events.moveend, handleStop);
        addEvent(events.move, handleMove);
      }
    }

    // 开始拖动
    addEvent(events.movestart, handleStart);

    return {
      stop: function() {
        removeEvent(events.movestart, handleStart);
      }
    };
  }

  window.movable = movable;
})();

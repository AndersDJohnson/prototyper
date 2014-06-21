

var componentDefs = {
  'root': {
    label: 'Root',
    hidden: true,
    construct: function () {
      return $('<div></div>');
    },
    draggables: ['*']
  },
  'div': {
    label: 'Div',
    construct: function () {
      return $('<div></div>');
    },
    draggables: ['*']
  },
  'span': {
    label: 'Span',
    construct: function (params) {
      params = $.extend({
        text: 'Span'
      }, params);
      return $('<span>' + params.text + '</span>');
    },
    draggables: ['*']
  },
  'zurb-foundation-5.row': {
    label: 'Row',
    construct: function () {
      return $('<div class="row"></div>');
    },
    draggables: ['zurb-foundation-5.column'],
    droppables: ['*']
  },
  'zurb-foundation-5.column': {
    label: 'Column',
    construct: function () {
      return $('<div class="column medium-6"></div>');
    },
    draggables: ['*'],
    droppables: ['zurb-foundation-5.row']
  },
  'zurb-foundation-5.button': {
    label: 'Button',
    construct: function () {
      return $('<button>Button</button>');
    },
    draggables: [],
    droppables: ['*']
  },
  'placeholdit.image': {
    label: 'Placehold.it Image',
    construct: function () {
      var $img = $('<img src="http://placehold.it/100x75" />');
      // prevent image source drag
      $img.on('dragstart', function (e) {
        e.preventDefault();
      });
      return $img;
    },
    draggables: [],
    droppables: ['*']
  },
  'placeholdit.image.2': {
    label: 'Placehold.it Image 2',
    construct: function () {
      var $img = $('<img src="http://placehold.it/50x50" />');
      // prevent image source drag
      $img.on('dragstart', function (e) {
        e.preventDefault();
      });
      return $img;
    },
    draggables: [],
    droppables: ['*']
  }
};


var prototyper = {};



$(function () {


  var $body = $(document.body);

  var dragging = false;
  var $draggable;

  var $selectedBox;
  var $selectedElement;
  var $reselectElement;

  var $highlightedBox;
  var $highlightedElement;

  var $insertParent;


  var boundingBoxToCornerPoints = function (bb) {
    var leftTop = {x: bb.left, y: bb.top};
    var leftBottom = {x: bb.left, y: bb.bottom};
    var rightTop = {x: bb.right, y: bb.top};
    var rightBottom = {x: bb.right, y: bb.bottom};
    return {
      leftTop: leftTop,
      leftBottom: leftBottom,
      rightTop: rightTop,
      rightBottom: rightBottom
    };
  };


  var pointDistance = function (a, b) {
    return Math.sqrt( Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) );
  };


  var setDragging = function ($el) {
    dragging = true;
    $draggable = $el;
    $body.addClass('is-dragging');
    $draggable.addClass('dragging');
  };


  var unsetDragging = function () {
    dragging = false;
    $body.removeClass('is-dragging');
    $draggable.removeClass('dragging');
    $draggable = null;
  };


  var bindDraggables = function ($sortable) {
    if (! $sortable) return;

    $sortable.find('[data-component]').each(function () {
      var $el = $(this);

      var draggable =  $el.data('draggable');
      if (draggable) {
        return;
      }

      $el.on('mousedown', function (e) {
        // console.log('mousedown');
        console.log('reselect', $el[0], $selectedElement);
        if ($selectedElement && $el.is($selectedElement)) {
          $reselectElement = $el;
        }
        unsetSelectedElement();
        setDragging($el);
      });

      $el.data('draggable', true);

    });

  };


  $(document).on('mouseup click', function (e) {
    if (dragging) {
      unsetDragging();
      if ($reselectElement) {
        setSelectedElement($reselectElement);
      }
      bindDraggables($root);
    }
  });


  var getCornersFromEl = function (el) {
    var corners = [];
    var $el = $(el);
    var boundingBox = getBoundingBox($el);
    var cornerPoints = boundingBoxToCornerPoints(boundingBox);
    _.each(cornerPoints, function (point, label) {
      corners.push({
        $el: $el,
        point: point,
        label: label
      });
    });
    return corners;
  };


  var getNearestCorner = function (point, selector, $container) {

    var $items = $container.find(selector);

    var candidateCorners = [];
    var insert;

    if ($items.length > 0) {
      insert = false;
      $items.each(function (i, el) {
        candidateCorners = candidateCorners.concat(getCornersFromEl(el));
      });
    }
    else {
      insert = true;
      candidateCorners = candidateCorners.concat(getCornersFromEl($container));
    }

    var nearestCorner = _.reduce(candidateCorners, function (soFar, candidateCorner) {
      if (! soFar) return candidateCorner;
      var sd = pointDistance(soFar.point, point);
      var cd = pointDistance(candidateCorner.point, point);
      return sd < cd ? soFar : candidateCorner;
    });

    return {
      insert: insert,
      corner: nearestCorner
    };
  };


  var componentId = 0;
  var createComponent = function (name, params) {
    params = $.extend({}, params);
    var componentDef = componentDefs[name];
    var $component = componentDef.construct(params);
    $component.attr('data-component-id', ++componentId);
    $component.attr('data-component', name);
    $component.data('component-data', {
      name: name,
      def: componentDef
    });
    return $component;
  };


  var accept = function ($draggable, $droppable) {
    return;
    var draggableData = $draggable.data('component-data');
    var droppableData = $droppable.data('component-data');
    // console.log('$droppable', $droppable[0], droppableData);
    // console.log('$draggable', $draggable[0], draggableData);
    var draggables = droppableData.def.draggables || [];
    var droppables = draggableData.def.droppables || [];
    var allowDrag = _.any(draggables, function (name) {
      var accept = name === '*' || draggableData.name === name;
      // console.log(droppableData.name, 'drags', draggableData.name, '?', accept);
      return accept;
    });
    var allowDrop = _.any(droppables, function (name) {
      var accept = name === '*' || droppableData.name === name;
      // console.log(draggableData.name, 'drops', droppableData.name, '?', accept);
      return accept;
    });
    return allowDrag && allowDrop;
  };


  var setSelectedElement = function ($newSelectedElement) {

    console.log('selecting box', $newSelectedElement[0]);

    $reselectElement = null;

    if ($newSelectedElement.is($selectedElement)) {
      return false;
    }

    if ($selectedBox) {
      unsetSelectedElement();
    }

    $selectedElement = $newSelectedElement;

    var $box = $('<div class="selected-box"></div>');
    var $border = $('<div class="selected-box-border"></div>');
    $box.append($border);
    var $controls = $('<div class="selected-box-controls"></div>');
    $box.append($controls);
    $controls.append($('<button class="delete">x</button>'));

    $border.on('mousedown', function (e) {
      $selectedElement.trigger('mousedown');
    });

    $controls.on('click', 'button.delete', function (e) {
      $selectedElement.remove();
      unsetSelectedElement();
      unsetHighlightedBox();
    });

    $selectedBox = $box;

    $box.hide(); 
    $contextLayer.append($box);
    drawSelectedBox();
    $box.show();
  };


  var unsetSelectedElement = function () {
    if ($selectedBox) {
      $selectedBox.remove();
    }
    $selectedBox = null;
    $selectedElement = null;
  };


  var setHighlightedBox = function ($newHighlightedElement) {

    if ($highlightedElement && $newHighlightedElement.is($highlightedElement)) {
      return false;
    }

    if ($selectedElement && $newHighlightedElement.is($selectedElement)) {
      return false;
    }

    if ($highlightedBox) {
      unsetHighlightedBox();
    }

    $highlightedElement = $newHighlightedElement;

    // console.log('setHighlightedBox', $droppable[0]);

    var $box = $('<div class="highlighted-box"></div>');
    $highlightedBox = $box;
    $box.hide(); 
    $contextLayer.append($box);
    drawHighlightedBox();
    $box.show();
  };


  var unsetHighlightedBox = function () {
    if ($highlightedBox) {
      $highlightedBox.remove();
    }
    $highlightedBox = null;
    $highlightedElement = null;
  };


  var getBoundingBox = function ($el) {
    var width = $el.outerWidth();
    var height = $el.outerHeight();
    var offset = $el.offset();
    var left = offset.left;
    var top = offset.top;
    var right = left + width;
    var bottom = top + height;
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      width: width,
      height: height
    };
  };


  var getBoxBounds = function ($el) {
    var rootOffset = $root.offset();
    var elOffset = $el.offset();
    var relativeOffset = {
      top: elOffset.top - rootOffset.top,
      left: elOffset.left - rootOffset.left
    };
    var width = $el.outerWidth();
    var height = $el.outerHeight();
    return {
      left: relativeOffset.left,
      top: relativeOffset.top,
      width: width,
      height: height
    };
  };


  var drawHighlightedBox = function () {

    if ($highlightedBox && $highlightedElement) {

      var boxBounds = getBoxBounds($highlightedElement);

      $highlightedBox.css({
        left: boxBounds.left,
        top: boxBounds.top,
        width: boxBounds.width,
        height: boxBounds.height
      });

    }

  };


  var drawSelectedBox = function () {

    if ($selectedBox && $selectedElement) {

      var boxBounds = getBoxBounds($selectedElement);
      // console.log('boxBounds', boxBounds);
      // console.log('$selectedBox', $selectedBox[0]);

      $selectedBox.css({
        left: boxBounds.left,
        top: boxBounds.top,
        width: boxBounds.width,
        height: boxBounds.height
      });

    }

  };


  var drawBoxes = function () {
    drawHighlightedBox();
    drawSelectedBox();
  };


  var $displayContainer = $('.display-container');
  var $rootContainer = $('.root-container');

  var $contextLayer = $('<div class="context-layer"></div>');
  $rootContainer.append($contextLayer);
  // $contextLayer = $rootContainer;

  var $root = prototyper.root = createComponent('root');

  $rootContainer.append($root);


  $root.on('scroll', function (e) {
    drawBoxes();
  });


  // auto init mode for dev

  var purled = purl();

  if (purled.param('init') === 'sortable-spans') {
    for (var i = 0; i < 40; ++i) {
      var $i = createComponent('span', {
        text: 'Item ' + i
      });
      $root.append($i);
    }
  }


  var addSortability = function ($sortable) {

    // var $sortable = $('<div class="sortable" data-component></div>');

    $sortable.css('position', 'relative');

    $sortable.on('mousemove', function (e) {


      var $target = $(e.target);
      var $closest = $target.closest('[data-component]');

      if ($insertParent) {
        $insertParent.removeClass('insert-parent');
      }

      // console.log('target', $target[0]);
      console.log('closest', $closest[0]);

      var data = $closest.data('component-data');
      // console.log('data', data);

      var x = e.pageX;
      var y = e.pageY;
      var point = {x: x, y: y};
      var nearestCorner = getNearestCorner(point, '[data-component]', $closest);
      console.log('nearest', nearestCorner)


      if (! dragging) {
        return;
      }


      var method;
      if (nearestCorner.corner.label === 'leftBottom' || nearestCorner.corner.label === 'leftTop') {
        method = 'before';
      }
      else {
        method = 'after';
      }

      /**
       * Check to prevent DOMException HierarchyRequestError.
       */
      var canInsertInto = function ($toInsert, $container) {
        $toInsert = $($toInsert);
        $container = $($container);
        var same = $toInsert.is($container);
        var nested = $container.closest($toInsert).length;
        var bad = same || nested;
        return ! bad;
      };


      if (nearestCorner.insert) {
        method = method === 'before' ? 'prepend' : 'append';
        if (! canInsertInto($draggable, $closest)) {
          return;
        }
        try {
          $closest[method]($draggable);
          $insertParent = $closest;
          $insertParent.addClass('insert-parent');
        }
        catch (e) {
          console.log(e, 'insert', $closest[0]);
        }
      }
      else {
        var $el = nearestCorner.corner.$el;
        var $parent = $el.parent();
        if (! canInsertInto($draggable, $parent)) {
          return;
        }
        try {
          $el[method]($draggable);
        }
        catch (e) {
          console.log(e, 'not insert', $el[0]);
        }
      }

      drawSelectedBox();

    });

    bindDraggables($sortable);

  };


  addSortability($root);


  $rootContainer.on('click', '[data-component]', function (e) {
    var $target = $(e.target);
    var $this = $(this);
    console.log('click');
    e.stopPropagation();
    if ($this.is('[data-component]')) {
      setSelectedElement($this);
    }
  });


  var $componentControlContainer = $('.component-control-container');


  $.each(componentDefs, function (name, def) {

    if (def.hidden) {
      return;
    }

    var $control = $('<div></div>');
    $control.attr('data-component-control', name);
    $control.text(def.label);

    $componentControlContainer.append($control);

    $control.data('component-data', {
      name: name,
      def: def
    });

  });


  var $componentControls = $componentControlContainer.find('[data-component-control]');

  $componentControls.on('mousedown', function (e) {
    unsetSelectedElement();
    var $target = $(e.target);
    $draggable = $target;
    var data = $draggable.data('component-data');
    console.log(data);
    var $component = createComponent(data.name);
    setDragging($component);
  });

});

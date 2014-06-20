

var componentDefs = {
  'root': {
    hidden: true,
    construct: function () {
      return $('<div></div>');
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
  'placeholdit.image': {
    label: 'Placehold.it Image',
    construct: function () {
      return $('<div class="placeholdit-image"><img src="http://placehold.it/100x75" /></div>');
    },
    draggables: [],
    droppables: ['*']
  },
  'placeholdit.image.2': {
    label: 'Placehold.it Image 2',
    construct: function () {
      return $('<div class="placeholdit-image"><img src="http://placehold.it/50x50" /></div>');
    },
    draggables: [],
    droppables: ['*']
  }
};


var prototyper = {};


$(function () {


  var $body = $(document.body);

  var dragging = false;


  var createComponent = function (id) {
    var componentDef = componentDefs[id];
    var $component = componentDef.construct();
    $component.attr('data-component', id);
    $component.data('component-data', {
      id: id,
      def: componentDef
    });
    return $component;
  };


  var accept = function ($draggable, $droppable) {
    var draggableData = $draggable.data('component-control-data');
    var droppableData = $droppable.data('component-data');
    // console.log('$droppable', $droppable[0], droppableData);
    // console.log('$draggable', $draggable[0], draggableData);
    var draggables = droppableData.def.draggables || [];
    var droppables = draggableData.def.droppables || [];
    var allowDrag = _.any(draggables, function (id) {
      var accept = id === '*' || draggableData.id === id;
      // console.log(droppableData.id, 'drags', draggableData.id, '?', accept);
      return accept;
    });
    var allowDrop = _.any(droppables, function (id) {
      var accept = id === '*' || droppableData.id === id;
      // console.log(draggableData.id, 'drops', droppableData.id, '?', accept);
      return accept;
    });
    return allowDrag && allowDrop;
  };


  var setupDroppable = function ($droppable) {

    var data = $droppable.data('component-data');

    // console.log('setting up droppable', data);

    $droppable.droppable({
      greedy: true, // false
      accept: function ($draggable) {
        var $droppable = $(this);
        return accept($draggable, $droppable);
      }
    });

    $droppable.on('drop', function (e, ui) {
      e.stopPropagation();
      var $target = $(e.target);
      $target.removeClass('dropover');
      var componentId = ui.draggable.attr('data-component-control');
      var $component = createComponent(componentId);

      if ($target.is($dropAround)) {
        if (dropStrategy === 'before') {
          $dropAround.prepend($component);
        }
        else if (dropStrategy === 'after') {
          $dropAround.append($component);
        }
        else {
          throw new Error('unknown drop strategy "' + dropStrategy + '"');
        }
      }
      else {
        if (dropStrategy === 'before') {
          $dropAround.before($component);
        }
        else if (dropStrategy === 'after') {
          $dropAround.after($component);
        }
        else {
          throw new Error('unknown drop strategy "' + dropStrategy + '"');
        }
      }

      updateComponents();
      // drawBoxes();
    });


  };


  var $draggable;

  var $dropInto;
  var $dropAround;
  var dropStrategy;


  var $highlightedBox;
  var $highlightedElement;
  var $selectedBox;
  var $selectedElement;


  var setSelectedBox = function ($newSelectedElement) {

    console.log('selecting box', $newSelectedElement[0]);

    if ($newSelectedElement.is($selectedElement)) {
      return false;
    }

    if ($selectedBox) {
      unsetSelectedBox();
    }

    $selectedElement = $newSelectedElement;

    var $box = $('<div class="selected-box"></div>');
    var $controls = $('<div class="selected-controls"></div>');
    $box.append($controls);
    $controls.append($('<button class="delete">x</button>'));

    $controls.on('click', 'button.delete', function (e) {
      $selectedElement.remove();
      unsetSelectedBox();
      unsetHighlightedBox();
    });

    $selectedBox = $box;
    $box.hide(); 
    $contextLayer.append($box);
    drawSelectedBox();
    $box.show();
  };


  var unsetSelectedBox = function () {
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

  // var $contextLayer = $('<div class="context-layer"></div>');
  // $rootContainer.append($contextLayer);
  $contextLayer = $rootContainer;

  var $root = prototyper.root = createComponent('root');

  $rootContainer.append($root);


  $root.on('scroll', function (e) {
    drawBoxes();
  });


  $rootContainer.on('click', '[data-component]', function (e) {
    var $target = $(e.target);
    var $this = $(this);
    console.log('click');
    e.stopPropagation();
    if ($this.is('[data-component]')) {
      setSelectedBox($this);
    }
  });


  // $rootContainer.on('mousemove', function (e) {
  $rootContainer.on('mousemove', '[data-component]', function (e) {

    var $this = $(this);
    var $target = $(e.target);

    console.log('$target', $target[0]);

    if ($target.is('[data-component]')) {

      $dropInto = $target;

      if (! $dropInto) {
        return;
      }

      if (dragging && $draggable) {
        if (accept($draggable, $dropInto)) {
          setHighlightedBox($dropInto);
        }
      }

    }

    var $closestComponent = $target.closest('[data-component]');
    // var $closestComponent = $this.closest('[data-component]');
    if ($closestComponent.length) {
      console.log('$closestComponent', $closestComponent[0]);

      if (! dragging) {
        setHighlightedBox($closestComponent);
      }
      else {

        $dropAround = $closestComponent;

        var offset = $closestComponent.offset();
        var width = $closestComponent.outerWidth();
        var height = $closestComponent.outerHeight();
        var left = offset.left;
        var top = offset.top;
        var right = offset.left + width;
        var bottom = offset.top + height;
        var centerX = left + (width / 2);
        var centerY = top + (height / 2);
        var beforeX = e.pageX < centerX;
        var beforeY = e.pageY < centerY;
        // console.log([e.pageX, e.pageY],[left, top],[right, bottom]);
        // console.log('before x', beforeX, 'y', beforeY);

        var displayCSS = $closestComponent.css('display');
        var floatCSS = $closestComponent.css('float');
        // console.log(displayCSS, floatCSS);

        var isInlineDisplay = function (css) {
          return css === 'inline-block' || css === 'inline';
        };
        var isFloated = function (css) {
          return css !== 'none';
        };

        if (isInlineDisplay(displayCSS) || isFloated(floatCSS)) {
          if (beforeX) {
            dropStrategy = 'before';
          }
          else {
            dropStrategy = 'after';
          }
        }
        else {
          if (beforeY) {
            dropStrategy = 'before';
          }
          else {
            dropStrategy = 'after';
          }
        }
        console.log('$dropAround', $dropAround[0]);
        console.log('dropStrategy', dropStrategy);

        // console.log('$dropAround', $dropAround[0]);
      }
    }

    // closest...?

  });


  setupDroppable($root, {
    draggables: ['*']
  });


  var updateComponents = function () {

    var $droppables = $root.find('[data-component]');

    $droppables.each(function (i, el) {
      var $droppable = $(el);

      if ($droppable.data('ui-droppable')) {
        return;
      }

      var componentData = $droppable.data('component-data');
      var componentDef = componentData.def;

      setupDroppable($droppable);
    });

  };


  var $componentControlContainer = $('.component-control-container');


  $.each(componentDefs, function (id, def) {

    if (def.hidden) {
      return;
    }

    var $control = $('<div></div>');
    $control.attr('data-component-control', id);
    $control.text(def.label);

    $componentControlContainer.append($control);

    var $draggableHelper = $('<div class="draggable-helper"><div class="crosshairs">x</div></div>');

    $control.data('component-control-data', {
      id: id,
      def: def
    });

    $control.draggable({
      helper: function () {
        return $draggableHelper;
      },
      cursorAt: {
        top: 0,
        left: 0
      }
    })
  });


  var $componentControls = $componentControlContainer.find('[data-component-control]');


  $componentControls.on('dragstart', function (e, ui) {
    dragging = true;
    var $target = $(e.target);
    $draggable = $target;
    // console.log('dragstart', $draggable[0]);
    var data = $draggable.data('component-control-data');
    $body.addClass('dragging');
    drawBoxes();
  });

  $componentControls.on('drag', function (e, ui) {
    // console.log(e);
  });

  $componentControls.on('dragstop', function (e, ui) {
    dragging = false;
    $body.removeClass('dragging');
    // console.log('dragstop');
    drawBoxes();
  });


  updateComponents();

});

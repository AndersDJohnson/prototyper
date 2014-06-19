
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
    draggables: ['zurb-foundation-5.column']
  },
  'zurb-foundation-5.column': {
    label: 'Column',
    construct: function () {
      return $('<div class="column medium-6"></div>');
    },
    draggables: ['*']
  },
  'placeholdit.image': {
    label: 'Placehold.it Image',
    construct: function () {
      return $('<div><img src="http://placehold.it/200x150" /></div>');
    },
    draggables: ['*']
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


  var setupDroppable = function ($droppable) {

    var data = $droppable.data('component-data');

    console.log('setting up droppable', data);

      $droppable.droppable({
        greedy: true, // false
        accept: function ($draggable) {
          var draggableData = $draggable.data('component-control-data');
          var $droppable = $(this);
          var droppableData = $droppable.data('component-data');
          // console.log('$droppable', $droppable[0], droppableData);
          // console.log('$draggable', $draggable[0], draggableData);
          var any = _.any(droppableData.def.draggables, function (id) {
            var accept = id === '*' || draggableData.id === id;
            // console.log(droppableData.id, 'accepts', draggableData.id, '?', accept);
            return accept;
          });
          // console.log(any);
          return any;
        }
      });

      $droppable.on('dropover', function (e, ui) {
        e.stopPropagation();
        var $target = $(e.target);
        var data = $target.data('component-data');
        console.log('dropover data', data);
        $target.addClass('dropover');
      });

      $droppable.on('dropout', function (e, ui) {
        e.stopPropagation();
        $(e.target).removeClass('dropover');
      });

      $droppable.on('drop', function (e, ui) {
        e.stopPropagation();
        var $target = $(e.target);
        $target.removeClass('dropover');
        var componentId = ui.draggable.attr('data-component-control');
        var $component = createComponent(componentId);
        $target.append($component);
        update();
      });
  };


  var $rootContainer = $('.root-container');

  var $root = prototyper.root = createComponent('root');

  $rootContainer.append($root);


  var showComponentUI = function ($component) {
    var offset = $component.offset();
    var width = $component.outerWidth();
    var height = $component.outerHeight();

    var $uiContainer = $('<div class="component-ui-container"><div class="component-ui"></div></div>');
    var $ui = $uiContainer.find('.component-ui');
    $uiContainer.css({
      left: offset.left,
      top: offset.top
    });
    $ui.width(width);
    $ui.height(height);
    $body.append($uiContainer);

    var data = $component.data('component-data') || {};

    if (data.id) {
      console.log('ui for', data.id);
    }
    data.uiShowing = true;
    data.$uiContainer = $uiContainer;
    $component.data('component-data', data);

    $uiContainer.one('mouseleave', function (e) {
      hideComponentUI($component);
    })
  };

  var hideComponentUI = function ($component) {
    var data = $component.data('component-data') || {};
    if (data.$uiContainer) {
      data.uiShowing = false;
      data.$uiContainer.remove();
      data.$uiContainer = null;
    }
    $component.data('component-data', data);
  };


  // TODO: fix failure to trigger mouseenter/mouseleave events with fast mouse movement

  $root.on('mouseenter', '[data-component]', function (e) {

    if (dragging) {
      return;
    }

    var $target = $(e.target);
    var $component = $target.closest('[data-component]');

/*
    var $components = $root.find('[data-component]');
    var $others = $components.not($component);
    $components.removeClass('hover');
    $components.each(function (i, el) {
      hideComponentUI($(el));
    });
    */

    $component.addClass('hover');
    // showComponentUI($component);
  });

  $root.on('mouseleave', '[data-component]', function (e) {

    if (dragging) {
      return;
    }

    var $target = $(e.target);
    var $component = $target.closest('[data-component]');


    var data = $component.data('component-data') || {};
    if (data.uiShowing) {
      return false;
    }
    $component.removeClass('hover');
    // hideComponentUI($component);
  });


  setupDroppable($root, {
    draggables: ['*']
  });


  var update = function () {
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
    var $target = $(e.target);
    // console.log('dragstart', $target[0]);
    var data = $target.data('component-control-data');
    $body.addClass('dragging');
    dragging = true;
  });

  $componentControls.on('drag', function (e, ui) {
    // console.log(e);
  });

  $componentControls.on('dragstop', function (e, ui) {
    $body.removeClass('dragging');
    dragging = false;
  });

  update();

});

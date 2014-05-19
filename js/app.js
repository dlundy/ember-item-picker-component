App = Ember.Application.create();

// Handlebars helper to do string highlighting.
Ember.Handlebars.helper('highlight', function(str, start, end, options) {
  if (start >= 0 && end > 0) {
    var left, middle, right;
    left = (start > 0) ? str.slice(0, start) : '';
    middle = str.slice(start, end);
    right = str.slice(end)
    return new Handlebars.SafeString(left + '<em>' + middle + '</em>' + right);
  }
  else {
    return str;
  }
});

App.Album = Ember.Object.extend({
  title: '',
  imgUrl: '',
  artist: null
});

App.Artist = Ember.Object.extend({
  name: '',
  imgUrl: '',
  butt: ''
});

var sample_artists = [
  App.Artist.create({
    name: 'Kent',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/97759403/Kent+2014fEmilFagander_02500x33.jpg'
  }),
  App.Artist.create({
    name: 'Sólstafir',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/52647109/Slstafir.png'
  }),
  App.Artist.create({
    name: 'The Verve',
    imgUrl: 'http://userserve-ak.last.fm/serve/_/402611/The+Verve.jpg'
  }),
  App.Artist.create({
    name: 'Camera Obscura',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/60543725/Camera+Obscura+PNG.png'
  }),
  App.Artist.create({
    name: 'Spiritualized',
    imgUrl: 'http://userserve-ak.last.fm/serve/_/150972/Spiritualized.jpg'
  }),
  App.Artist.create({
    name: 'Thrawsunblat',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/87697953/Thrawsunblat+joelviolette.jpg'
  }),
  App.Artist.create({
    name: 'The Jam',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/29887139/The+Jam+all+mod+cons.jpg'
  }),
  App.Artist.create({
    name: 'M83',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/71481450/M83+3.png'
  }),
  App.Artist.create({
    name: 'Krallice',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/61806689/Krallice.png'
  }),
  App.Artist.create({
    name: 'Hakan Hellstrom',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/52943513/Hkan+Hellstrm++Andreas+hlund.jpg'
  }),
  App.Artist.create({
    name: 'Ulver',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/67319746/Ulver++PNG.png'
  }),
  App.Artist.create({
    name: 'Slowdive',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/96464657/Slowdive++better+miniature+prof.jpg'
  }),
  App.Artist.create({
    name: 'Hevisaurus',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/36679583/Hevisaurus+3540292784_photo.jpg'
  })
];

var sample_album = App.Album.create({
  title: 'Sound Affects',
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    // mock retrieving our sample album as the model
    return sample_album;
  }
});

App.IndexController = Ember.Controller.extend({
  artists: function() {
    // make available our list of artists to choose from
    return sample_artists;
  }.property()
})

// Component code
App.ItemPickerComponent = Ember.Component.extend({
  query: '',
  classNames: ['item-picker'],
  propertyName: '',
  _displayedResults: [],
  placeholder: 'Please make a selection.',

  didInsertElement: function() {
    this.fire();
  },

  displaySelected: function() {
    var property = this.getWithDefault('selected.' + this.get('propertyName'), this.get('selected'));
    if (property === undefined || property === null) {
      return this.get('placeholder');
    }
    else {
      return property;
    }
  }.property('selected'),

  // Debounced observer. Watches for query changes, but will only act on them every 300ms.
  queryChanged: function() {
    Ember.run.debounce(this, this.fire, 300);
  }.observes('query'),

  fire: function() {
    var query = this.get('query');
    results = [];
    var propertyName = this.get('propertyName');

    // valid query, push matches into items array
    if (query.length > 0) { 
      query = ' ' + query.toUpperCase().trim();
      this.get('items').forEach(function(item, index) {
        var match_str = ' ' + item.getWithDefault(propertyName, item).toUpperCase();
        var pos = match_str.indexOf(query);
        if (pos !== -1) {
          var newResult = {
            display: item.getWithDefault(propertyName, item),
            data: item,
            start: pos,
            end: (pos + query.length - 1)
          };
          results.push(newResult);
        }
      });
    }

    // empty or non-valid query, just show everything
    else {
      this.get('items').forEach(function(item, index) {
        results.push({
          display: item.getWithDefault(propertyName, item),
          data: item,
          start: -1,
          end: -1
        });
      });
    }
    this.set('_displayedResults', results);
  },

  activate: function() {
    if (this.get('active') !== true) {
      var eventNamespace = 'click.' + Ember.guidFor(this);
      var self = this;
      var container = this.$();

      $(document).on(eventNamespace, function(e) {
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          self.deactivate();
        }
        return false;
      });

      this.get('itemResultsView').activate();
      this.set('active', true);
      this.$('#dropdown-body').show();
      this.$('#dropdown-query-input').focus();
    }
  },

  deactivate: function() {
    if (this.get('active') !== false) {
      this.set('query', '');
      var eventNamespace = 'click.' + Ember.guidFor(this);
      $(document).off(eventNamespace);
      this.get('itemResultsView').deactivate();
      this.$('#dropdown-body').hide();
      this.set('active', false);
    }
  },

  actions: {
    toggle: function() {
      if (this.get('active')) { this.deactivate(); }
      else { this.activate(); }
    },
    pick: function(item) {
      this.set('selected', item);
      this.deactivate();
    }
  }

});


App.SelectableCollectionView = Ember.CollectionView.extend({
  attributeBindings: ["style"],

  style: function() {
    return "max-height: " + this.get('height');
  }.property(),

  actions: {
    childMouseEnter: function(index) {
      this.set('_highlightedIndex', index);
    }
  },

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);
    Ember.run.scheduleOnce('afterRender', this, 'highlightSelected');
  },

  activate: function() {
    var keyNamespace = 'keydown.' + Ember.guidFor(this);
    var self = this;
    // bind keyboard events
    $(document).on(keyNamespace, function(e) {
      if (e.which === 38) {
        self.decrementCursor();
      }
      else if (e.which === 40) {
        self.incrementCursor();
      }
      else if (e.which === 13) {
        var index = self.get('_highlightedIndex');
        var childView = self.get('childViews')[index];
        childView.click();
      }
    });
    Ember.run.scheduleOnce('afterRender', this, 'highlightSelected');
  },

  deactivate: function() {
    var keyNamespace = 'keydown.' + Ember.guidFor(this);
    // unbind keyboard events
    $(document).off(keyNamespace);
  },

  highlightSelected: function() {
    var obj = this.get('selected'),
        self = this,
        found = false,
        oldIndex = this.get('_highlightedIndex');

    this.get('childViews').forEach(function(view, index) {
      if (view.get('content.data') === obj) {
        self.set('_highlightedIndex', view.get('contentIndex'));
        found = true;
      }
    });
    if (found == false) {
      this.set('_highlightedIndex', 0);
    }
    // manually force a re-render if the highlighted index did not change.
    if (oldIndex == this.get('_highlightedIndex')) {
      this.highlightChanged();
    }
  },

  incrementCursor: function() {
    var length = this.get('content').length;
    var index = this.get('_highlightedIndex');
    if (index < length - 1) {
      this.incrementProperty('_highlightedIndex');
    }
    else {
      this.set('_highlightedIndex', 0);
    }
  },

  decrementCursor: function() {
    var length = this.get('content').length;
    var index = this.get('_highlightedIndex');
    if (index > 0) {
      this.decrementProperty('_highlightedIndex');
    }
    else {
      this.set('_highlightedIndex', length - 1);
    }
  },

  highlightWillChange: function() {
    var index = this.get('_highlightedIndex');
    if (index !== undefined) {
      var view = this.get('childViews')[index];
      if (view !== undefined) {
        view.set('isHighlighted', false);
      }
    }
  }.observesBefore('_highlightedIndex'),

  highlightChanged: function() {
    var index = this.get('_highlightedIndex'),
        views = this.get('childViews');

    if ((views.length > 0) && views[index] !== undefined) {
      var view = views[index];

      var viewportTop = this.$().scrollTop();
      var viewportBottom = viewportTop + this.$().height();

      var viewTop = viewportTop + view.$().position().top;
      var viewBottom = viewTop + view.$().outerHeight();

      // Determine if selected item is outside of current view's viewport.
      // if view above viewport, scroll so that top of view is aligned at top of container
      if (viewportTop > viewTop) {
        this.$().scrollTop(viewTop);
      }
      // if view below viewport, scroll so that bottom of view is aligned at bottom of container
      else if (viewBottom > viewportBottom) {
        this.$().scrollTop(viewBottom - this.$().height());
      }

      views[index].set('isHighlighted', true);
    }
  }.observes('_highlightedIndex')

});

App.SelectableCollectionItemView = Ember.View.extend({

  classNames: 'dropdown-result',
  classNameBindings: ['isHighlighted'],
  isHighlighted: false,
  templateName: 'views/item-result',

  mouseEnter: function() {
    this.get('parentView').send('childMouseEnter', this.get('contentIndex'));
  },

  click: function() {
    this.get('controller').send('pick', this.get('content.data'));
  }

});
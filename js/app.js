App = Ember.Application.create();

// Handlebars helper to do string highlighting.
Ember.Handlebars.helper('highlight', function(str, start, end, options) {
  if (start >= 0 && end > 0) {
    var left, middle, right;
    left = (start > 0) ? str.slice(0, start) : "";
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
];

var sample_album = App.Album.create({
  title: 'Sound Affects',
  artist: sample_artists[6]
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
  query: "",
  classNames: ["item-picker"],
  propertyName: '',
  _displayedResults: [],

  displaySelected: function() {
    return this.getWithDefault('selected.' + this.get('propertyName'), this.get('selected'));
  }.property('selected'),

  // Debounced observer. Watches for query changes, but will only act on them every 300ms.
  watch: function() {
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
    var eventNamespace = "click." + Ember.guidFor(this);
    var self = this;
    var container = this.$();

    // Add external click handler on the document. This watches for any clicks on the document,
    // and if it sees one outside of the component, then it deactivates the dropdown.
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
  },

  deactivate: function() {
    this.set('query', '');
    var eventNamespace = "click." + Ember.guidFor(this);
    $(document).off(eventNamespace);
    this.get('itemResultsView').deactivate();
    this.$('#dropdown-body').hide();
    this.set('active', false);
  },

  actions: {
    // opens/closes the selection dropdown
    toggle: function() {
      if (this.get('active')) {
        this.deactivate();
      }
      else {
        this.activate();
      }
    },
    pick: function(item) {
      this.set('selected', item);
      this.deactivate();
    }
  },

  // when the component is ready on the DOM, then prepopulate it with results.
  didInsertElement: function() {
    this.fire();
  }
});

App.SelectableCollectionView = Ember.CollectionView.extend({

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);
    if (content !== undefined) {
      content.forEach(function(item, index) {
        item.index = index;
      });
    }
  },

  // when this is activated, should be passed info about where to scroll to and which item to be highlighted etc?
  // who is responsible for this?
  activate: function() {
    var keyNamespace = "keydown." + Ember.guidFor(this);
    var self = this;
    $(document).on(keyNamespace, function(e) {
      // up arrow
      if (e.which === 38) {
        self.decrementCursor();
      }
      // down arrow
      else if (e.which === 40) {
        self.incrementCursor();
      }
      else if (e.which === 13) {
        var index = self.get('_highlightedIndex');
        var childView = self.get('childViews')[index];
        childView.click();
      }
    });
  },
  deactivate: function() {
    var keyNamespace = "keydown." + Ember.guidFor(this);
    $(document).off(keyNamespace);
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
    // set to highest
    else {
      this.set('_highlightedIndex', length - 1);
    }
  },
  highlightChanged: function() {
    this.$('.highlighted').removeClass('highlighted');
    var index = this.get('_highlightedIndex');
    if (index !== undefined) {
      this.$('.dropdown-result:eq(' + index + ')').addClass('highlighted');
    }
  }.observes('_highlightedIndex'),
  actions: {
    childMouseEnter: function(index) {
      this.set('_highlightedIndex', index);
    }
  }
});

App.ItemResultView = Ember.View.extend({
  classNames: 'dropdown-result',
  templateName: 'views/item-result',
  mouseEnter: function() {
    this.get('parentView').send('childMouseEnter', this.get('content.index'));
  },
  mouseLeave: function() {
    this.get('parentView').send('childMouseLeave', this.get('content.index'));
  },
  click: function() {
    this.get('controller').send('pick', this.get('content.data'));
  }
});


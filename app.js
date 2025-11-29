var webstore = new Vue({
  el: '#app',
  data: {
    //URL of the API server
    apiUrl: 'https://after-school-backend-by7k.onrender.com', 
    
    showlesson: true,
    sortBy: 'price',
    sortOrder: 'ascending',
    lessons: [],
    searchResults: [], // Store search results separately
    cart: [],
    searchQuery: '',
    isSearching: false, // Track if a search is in progress
    order: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      method: 'Home',
      gift: false
    },
    errors: {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    },
    states: {
      Dubai: "Dubai",
      AbuDhabi: "Abu Dhabi",
      Sharjah: "Sharjah",
      Ajman: "Ajman",
      RasAlKhaimah: "Ras Al Khaimah",
      Fujairah: "Fujairah",
      UmmAlQuwain: "Umm Al Quwain"
    }
  },
  
  mounted: function() {
    this.fetchlessons();
  },
  
  watch: {
    // Watch for changes in searchQuery and trigger API search
    searchQuery: function(newQuery) {
      if (newQuery.trim() === '') {
        this.searchResults = [];
        this.isSearching = false;
      } else {
        this.performSearch(newQuery);
      }
    }
  },
  
  methods: {
    // Fetch lessons from MongoDB
    fetchlessons: function() {
      fetch(`${this.apiUrl}/collection/lessons`)
        .then(response => response.json())
        .then(data => {
          this.lessons = data;
          console.log('Lessons loaded:', data);
        })
        .catch(error => {
          console.error('Error fetching lessons:', error);
          alert('Failed to load lessons. Please check if the API server is running.');
        });
    },

    // Perform search using the API
    performSearch: function(query) {
      this.isSearching = true;
      fetch(`${this.apiUrl}/search/lessons?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          this.searchResults = data;
          this.isSearching = false;
          console.log('Search results:', data);
        })
        .catch(error => {
          console.error('Error searching lessons:', error);
          this.isSearching = false;
        });
    },

    addToCart: function (lesson) {
      if (this.canAddToCart(lesson)) {
        this.cart.push(lesson.id);
      }
    },
    
    canAddToCart: function (lesson) {
      return this.availableSpaces(lesson.id) > 0;
    },
    
    availableSpaces: function (id) {
      let lesson = this.lessons.find(p => p.id === id);
      if (!lesson) return 0;
      return lesson.spaces - this.cartCount(id);
    },
    
    cartCount: function (id) {
      let count = 0;
      for (let i = 0; i < this.cart.length; i++) {
        if (this.cart[i] === id) {
          count++;
        }
      }
      return count;
    },
    
    increaseQuantity: function (id) {
      if (this.canIncreaseQuantity(id)) {
        this.cart.push(id);
      }
    },
    
    decreaseQuantity: function (id) {
      let index = this.cart.indexOf(id);
      if (index > -1) {
        this.cart.splice(index, 1);
      }
    },
    
    removeFromCart: function (id) {
      this.cart = this.cart.filter(itemId => itemId !== id);
    },
    
    canIncreaseQuantity: function (id) {
      return this.availableSpaces(id) > 0;
    },
    
    getIcon: function (subject) {
      if (subject === 'Math') return 'fa-solid fa-calculator';
      if (subject === 'English') return 'fa-solid fa-pen';
      if (subject === 'Music') return 'fa-solid fa-music';
      return 'fa-solid fa-book';
    },
    
    getImage: function (lesson) {
      //  Use the image path from the database
      return lesson.image || './images/default.png';
    },
    
    toggleCheckout: function () {
      this.showlesson = !this.showlesson;
      if (!this.showlesson) {
        this.resetErrors();
      }
    },
    
    validateField: function (field) {
  const value = this.order[field].trim();

  // Check empty
  if (!value) {
    this.errors[field] = 'This field is required';
    return;
  }

  // Name fields – letters only
  if (field === 'firstName' || field === 'lastName') {
    if (!/^[A-Za-z\s]+$/.test(value)) {
      this.errors[field] = 'Only letters are allowed';
    } else {
      this.errors[field] = '';
    }
    return;
  }

  // City – letters only
  if (field === 'city') {
    if (!/^[A-Za-z\s]+$/.test(value)) {
      this.errors.city = 'City must contain only letters';
    } else {
      this.errors.city = '';
    }
    return;
  }

  // ZIP – numbers only
  if (field === 'zip') {
    if (!/^\d+$/.test(value)) {
      this.errors.zip = 'Zip code must contain only numbers';
    } else if (value.length < 5) {
      this.errors.zip = 'Zip code must be at least 5 digits';
    } else {
      this.errors.zip = '';
    }
    return;
  }

  // Default — no special rule
  this.errors[field] = '';
},
    
    validateAllFields: function () {
      this.validateField('firstName');
      this.validateField('lastName');
      this.validateField('address');
      this.validateField('city');
      this.validateField('state');
      this.validateField('zip');
    },
    
    resetErrors: function () {
      this.errors = {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      };
    },
    
    //  Submit order to database
    submitForm: function () {
      this.validateAllFields();
      
      if (this.isFormValid) {
        const orderData = {
          firstName: this.order.firstName,
          lastName: this.order.lastName,
          address: this.order.address,
          city: this.order.city,
          state: this.order.state,
          zip: this.order.zip,
          method: this.order.method,
          gift: this.order.gift,
          items: this.cartItems,
          total: parseFloat(this.cartTotal),
          orderDate: new Date().toISOString()
        };
        
        fetch(`${this.apiUrl}/collection/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
          console.log('Order saved:', data);
          this.updatelessonspaces();
          alert("Order submitted successfully!");
          
          // Reset cart and form
          this.cart = [];
          this.order = {
            firstName: "",
            lastName: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            method: 'Home',
            gift: false
          };
          this.resetErrors();
          this.showlesson = true;
        })
        .catch(error => {
          console.error('Error submitting order:', error);
          alert('Failed to submit order. Please try again.');
        });
      } else {
        alert("Please fill in all required fields correctly");
      }
    },
    
    // Update lesson spaces after order
    updatelessonspaces: function() {
      this.cartItems.forEach(item => {
        const lesson = item.lesson;
        const newSpaces = lesson.spaces - item.quantity;
        
        fetch(`${this.apiUrl}/collection/lessons/${lesson._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ spaces: newSpaces })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Lesson spaces updated:', data);
          
          // Update local lesson data
          const locallesson = this.lessons.find(p => p.id === lesson.id);
          if (locallesson) {
            locallesson.spaces = newSpaces;
          }
        })
        .catch(error => {
          console.error('Error updating lesson spaces:', error);
        });
      });
    }
  },
  
  computed: {
    buttonText() {
      return this.showlesson ? "Checkout" : "Home";
    },
    sortedlessons: function () {
      let lessonsArray = this.lessons.slice(0);
      let sortBy = this.sortBy;
      let sortOrder = this.sortOrder;
      
      lessonsArray.sort(function (a, b) {
        let comparison = 0;
        
        if (sortBy === 'subject') {
          comparison = a.subject.localeCompare(b.subject);
        } else if (sortBy === 'location') {
          comparison = a.location.localeCompare(b.location);
        } else if (sortBy === 'price') {
          comparison = a.price - b.price;
        } else if (sortBy === 'spaces') {
          comparison = a.spaces - b.spaces;
        }
        
        return sortOrder === 'ascending' ? comparison : -comparison;
      });
      
      return lessonsArray;
    },

    // Use search results from API when searching, otherwise use sorted lessons
    filteredlessons: function () {
      let query = this.searchQuery.trim();

      // If no search query, return sorted lessons
      if (!query) {
        return this.sortedlessons;
      }

      // If searching, return search results 
      let results = this.searchResults.slice(0);
      let sortBy = this.sortBy;
      let sortOrder = this.sortOrder;
      
      results.sort(function (a, b) {
        let comparison = 0;
        
        if (sortBy === 'subject') {
          comparison = a.subject.localeCompare(b.subject);
        } else if (sortBy === 'location') {
          comparison = a.location.localeCompare(b.location);
        } else if (sortBy === 'price') {
          comparison = a.price - b.price;
        } else if (sortBy === 'spaces') {
          comparison = a.spaces - b.spaces;
        }
        
        return sortOrder === 'ascending' ? comparison : -comparison;
      });
      
      return results;
    },
    
    cartItemCount: function () {
      return this.cart.length;
    },
    
    cartItems: function () {
      let items = {};
      let vm = this;
      
      this.cart.forEach(function (id) {
        if (items[id]) {
          items[id].quantity++;
        } else {
          let lesson = vm.lessons.find(function (p) {
            return p.id === id;
          });
          if (lesson) {
            items[id] = {
              lesson: lesson,
              quantity: 1
            };
          }
        }
      });
      
      return Object.values(items);
    },
    
    cartTotal: function () {
      let total = 0;
      this.cartItems.forEach(function (item) {
        total += item.lesson.price * item.quantity;
      });
      return total.toFixed(2);
    },
    
    isFormValid: function () {
      return (
        this.errors.firstName === '' &&
        this.errors.lastName === '' &&
        this.errors.address === '' &&
        this.errors.city === '' &&
        this.errors.state === '' &&
        this.errors.zip === '' &&
        this.order.firstName.trim() !== '' &&
        this.order.lastName.trim() !== '' &&
        this.order.address.trim() !== '' &&
        this.order.city.trim() !== '' &&
        this.order.state !== '' &&
        this.order.zip.trim() !== ''
      );
    }

  }
});
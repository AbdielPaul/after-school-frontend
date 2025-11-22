var webstore = new Vue({
  el: '#app',
  data: {
    showProduct: true,
    sortBy: 'price',
    sortOrder: 'ascending',
    lessons: [],
    cart: [],
    searchQuery: '', // ✅ Added for search
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
  methods: {

    //  Fetch lessons from MongoDB
    fetchlessons: function() {
      fetch('http://localhost:3000/collection/lessons')
        .then(response => response.json())
        .then(data => {
          this.lessons = data;
          console.log('lessons loaded:', data);
        })
        .catch(error => {
          console.error('Error fetching lessons:', error);
          alert('Failed to load lessons. Please make sure the server is running.');
        });
    },

    addToCart: function (product) {
      if (this.canAddToCart(product)) {
        this.cart.push(product.id);
      }
    },
    
    canAddToCart: function (product) {
      return this.availableSpaces(product.id) > 0;
    },
    
    availableSpaces: function (id) {
      let product = this.products.find(p => p.id === id);
      return product.spaces - this.cartCount(id);
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
    
    getImage: function (subject) {
      return 'images/' + subject + '.png';
    },
    
    toggleCheckout: function () {
      this.showProduct = !this.showProduct;
      if (!this.showProduct) {
        this.resetErrors();
      }
    },
    
    // ✅ Updated ZIP validation logic
    validateField: function (field) {
      if (!this.order[field] || this.order[field].trim() === '') {
        this.errors[field] = 'This field is required';
      } else {
        if (field === 'zip') {
          if (!/^\d+$/.test(this.order.zip)) {
            this.errors.zip = 'Zip code must contain only numbers';
          } else if (this.order.zip.length < 5) {
            this.errors.zip = 'Zip code must be at least 5 digits';
          } else {
            this.errors.zip = '';
          }
        } else {
          this.errors[field] = '';
        }
      }
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
    
    submitForm: function () {
      this.validateAllFields();
      
      if (this.isFormValid) {
        // Prepare order data
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
        
        // Save order to database
        fetch('http://localhost:3000/collection/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
          console.log('Order saved:', data);
          
          // Update product spaces in database
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
          this.showProduct = true;
        })
        .catch(error => {
          console.error('Error submitting order:', error);
          alert('Failed to submit order. Please try again.');
        });
      } else {
        alert("Please fill in all required fields correctly");
      }
    },

    updatelessonspaces: function() {
      this.cartItems.forEach(item => {
        const product = item.product;
        const newSpaces = product.spaces - item.quantity;
        
        // Update in database
        fetch(`http://localhost:3000/collection/lessons/${product._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ spaces: newSpaces })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Product spaces updated:', data);
          
          // Update local product data
          const localProduct = this.lessons.find(p => p.id === product.id);
          if (localProduct) {
            localProduct.spaces = newSpaces;
          }
        })
        .catch(error => {
          console.error('Error updating product spaces:', error);
        });
      });
    }
  
  },
  computed: {
    sortedProducts: function () {
      let productsArray = this.products.slice(0);
      let sortBy = this.sortBy;
      let sortOrder = this.sortOrder;
      
      productsArray.sort(function (a, b) {
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
      
      return productsArray;
    },

    // ✅ Search filter functionality
    filteredProducts: function () {
      let query = this.searchQuery.trim().toLowerCase();
      let sorted = this.sortedProducts;

      if (!query) return sorted;

      return sorted.filter(product =>
        product.subject.toLowerCase().includes(query) ||
        product.location.toLowerCase().includes(query)
      );
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
          let product = vm.products.find(function (p) {
            return p.id === id;
          });
          items[id] = {
            product: product,
            quantity: 1
          };
        }
      });
      
      return Object.values(items);
    },
    
    cartTotal: function () {
      let total = 0;
      this.cartItems.forEach(function (item) {
        total += item.product.price * item.quantity;
      });
      return total.toFixed(2);
    },
    
    isFormValid: function () {
      return this.order.firstName.trim() !== '' &&
             this.order.lastName.trim() !== '' &&
             this.order.address.trim() !== '' &&
             this.order.city.trim() !== '' &&
             this.order.state !== '' &&
             this.order.zip.trim() !== '' &&
             /^\d+$/.test(this.order.zip) &&
             this.order.zip.length >= 5; // ✅ must be numeric & at least 5 digits
    }
  }
});
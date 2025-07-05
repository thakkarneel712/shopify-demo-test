document.addEventListener('DOMContentLoaded', function() {
  // Initialize product page functionality
  const productForm = document.querySelector('form[action="/cart/add"]');
  if (!productForm) return;

  // 1. Ensure variant ID is available
  let currentVariantId = null;
  const variantInput = productForm.querySelector('input[name="id"]') || 
                      productForm.querySelector('select[name="id"]');
  
  if (variantInput) {
    currentVariantId = variantInput.value;
    
    // Watch for variant changes if it's a select element
    if (variantInput.tagName === 'SELECT') {
      variantInput.addEventListener('change', function() {
        currentVariantId = this.value;
      });
    }
  } else {
    console.error('Variant ID input not found - using first available variant');
    // Fallback to first available variant if no input found
    const variantData = JSON.parse(document.getElementById('ProductJson')?.textContent);
    if (variantData?.variants?.length) {
      currentVariantId = variantData.variants[0].id;
    }
  }

  // 2. Quantity selector functionality
  document.querySelectorAll('[data-quantity-change]').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.closest('.quantity-selector')?.querySelector('.quantity-input');
      if (!input) return;
      
      const change = parseInt(this.dataset.quantityChange) || 1;
      const currentValue = parseInt(input.value) || 1;
      const newValue = currentValue + change;
      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || Infinity;
      
      if (newValue >= min && newValue <= max) {
        input.value = newValue;
      }
    });
  });

  // 3. Add to cart functionality
  productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentVariantId) {
      console.error('Cannot add to cart - no variant ID available');
      return;
    }

    const addToCartButton = this.querySelector('.add-to-cart-button');
    const quantityInput = this.querySelector('.quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    const cartMessage = this.querySelector('.cart-message');
    const spinner = addToCartButton?.querySelector('.add-to-cart-spinner');
    
    // Show loading state
    if (addToCartButton) addToCartButton.disabled = true;
    if (spinner) spinner.hidden = false;
    if (addToCartButton) {
      const textElement = addToCartButton.querySelector('.add-to-cart-text');
      if (textElement) textElement.hidden = true;
    }
    if (cartMessage) {
      cartMessage.style.display = 'none';
      cartMessage.textContent = '';
    }

    // Prepare form data
    const formData = {
      items: [{
        id: currentVariantId,
        quantity: quantity
      }]
    };

    // Add to cart using AJAX
    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      if (cartMessage) {
        cartMessage.textContent = 'Item added to cart!';
        cartMessage.style.display = 'block';
        cartMessage.setAttribute('aria-label', 'Item added to cart');
        
        setTimeout(() => {
          cartMessage.style.display = 'none';
        }, 3000);
      }
      updateCartCount();
    })
    .catch(error => {
      console.error('Error:', error);
      if (cartMessage) {
        cartMessage.textContent = 'Error adding item to cart. Please try again.';
        cartMessage.style.display = 'block';
        cartMessage.setAttribute('aria-label', 'Error adding item to cart');
      }
    })
    .finally(() => {
      if (addToCartButton) addToCartButton.disabled = false;
      if (spinner) spinner.hidden = true;
      if (addToCartButton) {
        const textElement = addToCartButton.querySelector('.add-to-cart-text');
        if (textElement) textElement.hidden = false;
      }
    });
  });

  // 4. Update cart count function
  function updateCartCount() {
    fetch(window.Shopify.routes.root + 'cart.js')
      .then(response => response.json())
      .then(cart => {
        document.querySelectorAll('.cart-count').forEach(el => {
          if (el) el.textContent = cart.item_count;
        });
      })
      .catch(error => console.error('Error updating cart count:', error));
  }

  // 5. Thumbnail navigation (if needed)
  document.querySelectorAll('.product__thumbnail').forEach(thumbnail => {
    thumbnail.addEventListener('click', function(e) {
      e.preventDefault();
      const mediaId = this.dataset.thumbnailId;
      if (!mediaId) return;
      
      document.querySelectorAll('.product__thumbnail').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const targetMedia = document.querySelector(`.product__media-item[data-media-id="${mediaId}"]`);
      if (targetMedia) {
        document.querySelectorAll('.product__media-item').forEach(item => {
          item.style.display = 'none';
        });
        targetMedia.style.display = 'block';
      }
    });
  });
  
   // Color swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', function(e) {
      e.preventDefault();
      const optionIndex = this.dataset.optionIndex;
      const optionValue = this.dataset.value;
      
      if (!optionIndex || !optionValue) return;
      
      // Update active state
      const wrapper = this.closest('.color-swatch-wrapper');
      if (wrapper) {
        wrapper.querySelectorAll('.color-swatch').forEach(s => {
          s.classList.remove('active');
        });
      }
      this.classList.add('active');
      
      // Update variant selection
      const select = document.querySelector(`[data-index="option${optionIndex}"]`);
      if (select) {
        select.value = optionValue;
        select.dispatchEvent(new Event('change'));
      }
    });
  });

  // Read more/less functionality
  const readMoreBtn = document.querySelector('.product__read-more');
  const readLessBtn = document.querySelector('.product__read-less');
  
  if (readMoreBtn && readLessBtn) {
    const truncatedDesc = document.querySelector('.product__description-truncated');
    const fullDesc = document.querySelector('.product__description-full');
    
    if (truncatedDesc && fullDesc) {
      readMoreBtn.addEventListener('click', function() {
        truncatedDesc.style.display = 'none';
        fullDesc.style.display = 'block';
      });
      
      readLessBtn.addEventListener('click', function() {
        truncatedDesc.style.display = 'block';
        fullDesc.style.display = 'none';
      });
    }
  }

  // Collapsible rows
  document.querySelectorAll('.product__collapsible-button').forEach(button => {
    button.addEventListener('click', function() {
      const content = this.nextElementSibling;
      if (!content) return;
      
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      content.hidden = isExpanded;
    });
  });

  // Function to update cart count
  function updateCartCount() {
    fetch(window.Shopify.routes.root + 'cart.js')
      .then(response => response.json())
      .then(cart => {
        document.querySelectorAll('.cart-count').forEach(el => {
          el.textContent = cart.item_count;
        });
      })
      .catch(error => console.error('Error updating cart count:', error));
  }
});
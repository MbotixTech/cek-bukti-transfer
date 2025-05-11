document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const fileInputContainer = document.getElementById('fileInput-container');
  const previewContainer = document.getElementById('previewContainer');
  const uploadForm = document.getElementById('uploadForm');
  const resultContainer = document.getElementById('resultContainer');
  const uploadCard = document.querySelector('.upload-card');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const submitButton = document.getElementById('submitButton');
  
  if (uploadCard && typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(uploadCard, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.5
    });
  }
  
  ['dragover', 'dragenter', 'dragleave', 'drop'].forEach(eventName => {
    fileInputContainer.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });
  
  ['dragover', 'dragenter'].forEach(eventName => {
    fileInputContainer.addEventListener(eventName, function() {
      fileInputContainer.classList.add('active');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileInputContainer.addEventListener(eventName, function() {
      fileInputContainer.classList.remove('active');
    }, false);
  });
  
  fileInputContainer.addEventListener('drop', function(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      fileInput.files = files;
      handleFileSelect(files[0]);
    }
  });
  
  fileInputContainer.addEventListener('click', function() {
    fileInput.click();
  });
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = this.files[0];
      if (file) {
        handleFileSelect(file);
      }
    });
  }
  
  function handleFileSelect(file) {
    if (!file.type.match('image.*')) {
      alert('Silakan pilih file gambar (JPG, PNG)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file tidak boleh melebihi 5MB');
      return;
    }
    
    const reader = new FileReader();
    
    previewContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    reader.onload = function(event) {
      previewContainer.innerHTML = `
        <div class="relative">
          <img src="${event.target.result}" class="img-preview fade-in" alt="Preview">
          <button type="button" id="cancel-btn" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      
      submitButton.classList.remove('hidden');
      
      document.getElementById('cancel-btn').addEventListener('click', function() {
        fileInput.value = '';
        previewContainer.innerHTML = '';
        submitButton.classList.add('hidden');
      });
    };
    
    reader.readAsDataURL(file);
  }
  
  if (uploadForm) {
    uploadForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const file = fileInput.files[0];
      if (!file) {
        alert('Silakan pilih gambar terlebih dahulu');
        return;
      }
      
      loadingSpinner.classList.remove('d-none');
      fileInputContainer.style.display = 'none';
      previewContainer.style.display = 'none';
      submitButton.classList.add('hidden');
      
      const formData = new FormData();
      formData.append('image', file);
      
      fetch(window.location.origin + '/api/verify', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        loadingSpinner.classList.add('d-none');
        
        resultContainer.innerHTML = `
          <div class="result-card fade-in">
            <h3 class="text-xl font-bold mb-4">${data.status || 'Hasil Analisis'}</h3>
            <div class="result-content">
              <div class="authenticity-result ${data.isAuthentic ? 'authentic' : 'fake'}">
                <span class="status-icon">${data.isAuthentic ? '✓' : '✗'}</span>
                <p class="font-medium">${data.isAuthentic ? 'Bukti transfer ASLI' : 'Bukti transfer PALSU'}</p>
              </div>
              <p class="result-message mt-4">${data.message || ''}</p>
            </div>
            <button type="button" id="reset-btn" class="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-6 py-2 rounded-lg transition-all duration-300">
              Periksa Bukti Transfer Lainnya
            </button>
          </div>
        `;
        
        document.getElementById('reset-btn').addEventListener('click', function() {
          fileInput.value = '';
          fileInputContainer.style.display = 'flex';
          previewContainer.innerHTML = '';
          resultContainer.innerHTML = '';
        });
        
        resultContainer.scrollIntoView({ behavior: 'smooth' });
      })
      .catch(error => {
        console.error('Error:', error);
        loadingSpinner.classList.add('d-none');
        resultContainer.innerHTML = `
          <div class="alert alert-danger fade-in p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p>Terjadi kesalahan saat memproses gambar. Silakan coba lagi.</p>
            <button type="button" id="error-reset-btn" class="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300">
              Coba Lagi
            </button>
          </div>
        `;
        
        document.getElementById('error-reset-btn').addEventListener('click', function() {
          fileInputContainer.style.display = 'flex';
          resultContainer.innerHTML = '';
        });
      });
    });
  }

  function adjustForMobile() {
    const isMobile = window.innerWidth < 768;
    if (uploadCard && uploadCard._tiltSettings) {
      uploadCard._tiltSettings.max = isMobile ? 5 : 15;
    }
  }
  
  window.addEventListener('resize', adjustForMobile);
  adjustForMobile();
});


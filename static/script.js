document.addEventListener("DOMContentLoaded", () => {
    // Scroll Fade-In Animation
    const fadeElements = document.querySelectorAll('.scroll-fade-in');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // Animated Counters Logic
    const counters = document.querySelectorAll('.counter');
    const countersObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetEl = entry.target;
                const target = +targetEl.getAttribute('data-target');
                let count = 0;
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps

                const updateCounter = () => {
                    count += increment;
                    if (count < target) {
                        targetEl.innerText = Math.ceil(count);
                        requestAnimationFrame(updateCounter);
                    } else {
                        targetEl.innerText = target;
                    }
                };
                updateCounter();
                observer.unobserve(targetEl); // Run once
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => countersObserver.observe(counter));

    // Application Logic
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const previewZone = document.getElementById("previewZone");
    const imagePreview = document.getElementById("imagePreview");
    const scanningLaser = document.getElementById("scanningLaser");
    
    const analyzeBtn = document.getElementById("analyzeBtn");
    const btnLoader = document.getElementById("btnLoader");
    const btnText = analyzeBtn.querySelector(".btn-text");
    const resetBtn = document.getElementById("resetBtn");
    const newScanBtn = document.getElementById("newScanBtn");
    
    const uploadPanel = document.getElementById("uploadPanel");
    const resultsPanel = document.getElementById("resultsPanel");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const errorToast = document.getElementById("errorToast");
    
    const statusBanner = document.getElementById("statusBanner");
    const statusTitle = document.getElementById("statusTitle");
    const statusSubtitle = document.getElementById("statusSubtitle");
    
    let currentFile = null;

    // --- Interactive Story logic ---
    const awarenessToggle = document.getElementById("awarenessToggle");
    let isAwarenessMode = false;
    
    awarenessToggle.addEventListener("click", () => {
        isAwarenessMode = !isAwarenessMode;
        document.body.classList.toggle("awareness-mode", isAwarenessMode);
        document.body.classList.toggle("awareness-active", isAwarenessMode);
    });

    // Story Payloads
    const storyData = {
        "ewaste": [
            { img: "/static/images/ewaste.jpg", text: "Toxic metals contaminate soil and water supplies in developing nations." },
            { img: "/static/images/factory_pollution.jpg", text: "Millions of devices are discarded yearly due to simple manufacturing defects." },
            { img: "/static/images/ewaste.jpg", text: "Improper recycling destroys entire ecosystems." }
        ],
        "sustainable": [
            { img: "/static/images/pcb_clean.jpg", text: "AI-driven precision inspection catches defects before final assembly." },
            { img: "/static/images/pcb_clean.jpg", text: "Micro-repairs save raw materials and massive amounts of energy." },
            { img: "/static/images/pcb_clean.jpg", text: "Sustainable manufacturing protects the planet for future generations." }
        ]
    };

    const modal = document.getElementById("storyModal");
    const modalClose = document.getElementById("modalClose");
    const carouselTrack = document.getElementById("carouselTrack");
    const carouselDots = document.getElementById("carouselDots");
    const prevBtn = document.getElementById("prevSlide");
    const nextBtn = document.getElementById("nextSlide");
    const storyCards = document.querySelectorAll(".interactive-card");

    let currentSlideIndex = 0;
    let currentSlides = [];

    storyCards.forEach(card => {
        card.addEventListener("click", () => {
            const storyType = card.getAttribute("data-story");
            openModal(storyData[storyType]);
        });
    });

    function openModal(data) {
        currentSlides = data;
        currentSlideIndex = 0;
        renderCarousel(data);
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    modalClose.addEventListener("click", closeModal);
    modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

    function closeModal() {
        modal.classList.add("hidden");
        document.body.style.overflow = "auto";
    }

    function renderCarousel(data) {
        carouselTrack.innerHTML = "";
        carouselDots.innerHTML = "";
        
        data.forEach((slide, index) => {
            // Slide Element
            const div = document.createElement("div");
            div.className = "carousel-slide";
            div.innerHTML = `
                <img src="${slide.img}" alt="Slide image" onerror="this.onerror=null; this.src='/static/images/fallback.jpg';">
                <div class="carousel-caption">
                    <div class="slide-icon">💡</div>
                    <p>${slide.text}</p>
                </div>
            `;
            carouselTrack.appendChild(div);

            // Dot Element
            const dot = document.createElement("button");
            dot.className = "dot" + (index === 0 ? " active" : "");
            dot.addEventListener("click", () => goToSlide(index));
            carouselDots.appendChild(dot);
        });

        updateCarouselUI();
    }

    function goToSlide(index) {
        if (index < 0 || index >= currentSlides.length) return;
        currentSlideIndex = index;
        updateCarouselUI();
    }

    prevBtn.addEventListener("click", () => {
        goToSlide((currentSlideIndex - 1 + currentSlides.length) % currentSlides.length);
    });

    nextBtn.addEventListener("click", () => {
        goToSlide((currentSlideIndex + 1) % currentSlides.length);
    });

    function updateCarouselUI() {
        // Move track
        carouselTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
        // Update dots
        const dots = carouselDots.querySelectorAll(".dot");
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentSlideIndex);
        });
    }
    // --- End Interactive Story logic ---

    // Layman Terms Dictionary
    const laymanTerms = {
        "Open_circuit": "Broken connection in circuit",
        "Short_circuit": "Short circuit detected",
        "Mouse_bite": "Mouse Bite (Edge defect)",
        "Spur": "Spur (Protrusion error)",
        "Copper_salvage": "Excess copper found",
        "Pin_hole": "Pin hole in copper trace",
        "Missing_hole": "Missing structural hole"
    };

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "var(--cyan)";
        dropZone.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.2)";
    });

    dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(0, 240, 255, 0.3)";
        dropZone.style.boxShadow = "none";
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(0, 240, 255, 0.3)";
        dropZone.style.boxShadow = "none";
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (!file.type.match("image.*")) {
            showError("Invalid file type. Please upload an image file.");
            return;
        }

        currentFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropZone.classList.add("hidden");
            previewZone.classList.remove("hidden");
            // Do NOT activate scanning laser here, only during analysis to avoid continuous scan UX bug!
            scanningLaser.classList.add("hidden"); 
        };

        reader.readAsDataURL(file);
    }

    resetBtn.addEventListener("click", resetWorkspace);
    newScanBtn.addEventListener("click", resetWorkspace);

    function resetWorkspace() {
        currentFile = null;
        fileInput.value = "";
        previewZone.classList.add("hidden");
        resultsPanel.classList.add("hidden");
        uploadPanel.classList.remove("hidden");
        dropZone.classList.remove("hidden");
        scanningLaser.classList.add("hidden");
    }

    function showError(msg) {
        errorToast.querySelector("span").innerText = "⚠ " + msg;
        errorToast.classList.remove("hidden");
        setTimeout(() => { errorToast.classList.add("hidden"); }, 4000);
    }

    // Inference Matrix Execution
    analyzeBtn.addEventListener("click", async () => {
        if (!currentFile) return;

        // Trigger Loading UI & Laser
        scanningLaser.classList.remove("hidden");
        loadingOverlay.classList.remove("hidden");
        btnText.textContent = "ANALYZING...";
        btnLoader.classList.remove("hidden");
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append("file", currentFile);

        try {
            // Simulated delay for UX
            const minWait = new Promise(resolve => setTimeout(resolve, 1500));
            const apiCall = fetch("/predict", {
                method: "POST",
                body: formData
            });

            const [response] = await Promise.all([apiCall, minWait]);

            if (!response.ok) {
                throw new Error("Unable to analyze image. Please try again.");
            }

            const data = await response.json();
            displayResults(data);

            // Automatically scroll to results
            document.getElementById("resultsPanel").scrollIntoView({ behavior: 'smooth', block: 'center' });

        } catch (error) {
            showError(error.message);
        } finally {
            // Fix bug: Stop ALL loaders and animations exactly when backend finishes/fails
            scanningLaser.classList.add("hidden");
            loadingOverlay.classList.add("hidden");
            btnText.textContent = "INITIALIZE SCAN";
            btnLoader.classList.add("hidden");
            analyzeBtn.disabled = false;
        }
    });

    function displayResults(data) {
        uploadPanel.classList.add("hidden");
        resultsPanel.classList.remove("hidden");

        document.getElementById("annotatedImage").src = data.annotated_image;

        const breakdownDiv = document.getElementById("defectBreakdown");
        const badgeText = document.getElementById("badgeText");
        breakdownDiv.innerHTML = "";

        if (data.status === "Normal") {
            statusBanner.className = "status-banner clean";
            statusTitle.textContent = "NO DEFECT";
            statusSubtitle.textContent = "No defects detected. PCB is safe for production.";
            
            breakdownDiv.innerHTML = "<div class='defect-row'><span>Verification</span><span style='color: var(--green)'>Clear</span></div>";
            badgeText.textContent = "✅ Safe";
            badgeText.style.color = "var(--green)";
        } else {
            statusBanner.className = "status-banner defective";
            statusTitle.textContent = "DEFECT DETECTED";
            statusSubtitle.textContent = `Critical anomaly: ${data.total_defects} issue(s) found.`;
            
            for (const [defectType, count] of Object.entries(data.defect_summary)) {
                const readableName = laymanTerms[defectType] || defectType;
                const item = document.createElement("div");
                item.className = "defect-row";
                item.innerHTML = `
                    <span>${readableName}</span>
                    <span class="defect-count">${count} area(s)</span>
                `;
                breakdownDiv.appendChild(item);
            }
            badgeText.textContent = "⚠ Needs Attention";
            badgeText.style.color = "var(--red)";
        }
    }

    // --- Cinematic Interactive Slider Logic ---
    const comparisonSlider = document.getElementById("comparisonSlider");
    if (comparisonSlider) {
        const sliderRight = document.getElementById("sliderRight");
        const sliderHandle = document.getElementById("sliderHandle");
        const clickZoneLeft = document.querySelector(".click-zone-left");
        const clickZoneRight = document.querySelector(".click-zone-right");
        const sliderLeftInner = document.querySelector(".slider-left");
        const transformBtn = document.getElementById("transformActionBtn");
        const transformOverlay = document.getElementById("transformOverlayText");
        
        let isDragging = false;
        
        // Hover synching for absolute layered zones
        clickZoneLeft.addEventListener("mouseenter", () => sliderLeftInner.classList.add("hover-active"));
        clickZoneLeft.addEventListener("mouseleave", () => sliderLeftInner.classList.remove("hover-active"));
        clickZoneRight.addEventListener("mouseenter", () => sliderRight.classList.add("hover-active"));
        clickZoneRight.addEventListener("mouseleave", () => sliderRight.classList.remove("hover-active"));

        function updateSlider(xPos) {
            const rect = comparisonSlider.getBoundingClientRect();
            let percentage = ((xPos - rect.left) / rect.width) * 100;
            // Clamp between 0 and 100
            percentage = Math.max(0, Math.min(100, percentage));
            
            sliderHandle.style.left = `${percentage}%`;
            sliderRight.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
            
            // Adjust click zones dynamically so they don't overlap wrongly
            clickZoneLeft.style.width = `${percentage}%`;
            clickZoneRight.style.width = `${100 - percentage}%`;
            clickZoneRight.style.left = `${percentage}%`;
        }

        function onDrag(e) {
            if (!isDragging) return;
            const xPos = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            updateSlider(xPos);
        }

        sliderHandle.addEventListener("mousedown", (e) => { isDragging = true; e.preventDefault(); });
        sliderHandle.addEventListener("touchstart", (e) => { isDragging = true; }, {passive: true});
        
        window.addEventListener("mouseup", () => { isDragging = false; });
        window.addEventListener("touchend", () => { isDragging = false; });
        
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("touchmove", onDrag, {passive: true});

        // Auto-transform animation
        if (transformBtn) {
            transformBtn.addEventListener("click", () => {
                let current = parseFloat(sliderHandle.style.left) || 50;
                const duration = 1500;
                const startTime = performance.now();
                
                function animateSlider(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // easeInOutQuad
                    const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    const newPct = current - (current * easeProgress); // animate to 0%
                    
                    // Update visually
                    sliderHandle.style.left = `${newPct}%`;
                    sliderRight.style.clipPath = `polygon(${newPct}% 0, 100% 0, 100% 100%, ${newPct}% 100%)`;
                    clickZoneLeft.style.width = `${newPct}%`;
                    clickZoneRight.style.width = `${100 - newPct}%`;
                    clickZoneRight.style.left = `${newPct}%`;
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateSlider);
                    } else {
                        transformOverlay.classList.remove("hidden");
                        setTimeout(() => transformOverlay.classList.add("hidden"), 2500);
                    }
                }
                requestAnimationFrame(animateSlider);
            });
        }
    }
});

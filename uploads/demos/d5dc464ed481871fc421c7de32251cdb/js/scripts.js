
        // Temel değişkenler
        const navbar = document.querySelector('.navbar');
        const main = document.getElementById('main');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const closeBtn = document.querySelector('.close-btn');
        let isMobile = window.innerWidth <= 768;
        let isHovering = false;

        // Mobil menü kontrolü
        function toggleNav() {
            if (isMobile) {
                navbar.classList.toggle('active');
                document.body.classList.toggle('navbar-active');
                
                if (navbar.classList.contains('active')) {
                    navbar.style.width = '250px';
                    main.style.marginLeft = '250px';
                    main.style.width = 'calc(100% - 250px)';
                } else {
                    navbar.style.width = '60px';
                    main.style.marginLeft = '60px';
                    main.style.width = 'calc(100% - 60px)';
                }
            }
        }

        
		        // Logo animasyonu
        document.querySelector('.navbar').addEventListener('mouseover', function () {
            const gifLogo = document.querySelector('.open-logo');
            if (gifLogo) {
                const src = gifLogo.src;
                gifLogo.src = '';
                gifLogo.src = src;
            }
        });














document.addEventListener("DOMContentLoaded", function () {
    const videoData = [
        // Alev Kategorisi
        { category: "alev", src: "https://www.youtube.com/embed/sKSODygyHmk" },
        { category: "alev", src: "https://www.youtube.com/embed/v9QzrRQjqAw" },
        { category: "alev", src: "https://www.youtube.com/embed/00bdut5U8ys" },
        { category: "alev", src: "https://www.youtube.com/embed/Ip45MRyixy4" },
        { category: "alev", src: "https://www.youtube.com/embed/Pj3INV9qVgY" },
        { category: "alev", src: "https://www.youtube.com/embed/eDnFO0Prpio" },
        { category: "alev", src: "https://www.youtube.com/embed/AlfaKthXqN0" },
        { category: "alev", src: "https://www.youtube.com/embed/_k3Ny7fPjvA" },
        { category: "alev", src: "https://www.youtube.com/embed/1cYkDFgQzpI" },
        
        // Volkan Kategorisi
        { category: "volkan", src: "https://www.youtube.com/embed/R_IsEg3HeNk" },
        { category: "volkan", src: "https://www.youtube.com/embed/IoriISJManU" },
        { category: "volkan", src: "https://www.youtube.com/embed/XEH_mJFH6Dc" },
        { category: "volkan", src: "https://www.youtube.com/embed/eS3AH4VNHFc" },
        { category: "volkan", src: "https://www.youtube.com/embed/UcqYMRlyeK0" },
        
        // Buz Kategorisi
        { category: "buz", src: "https://www.youtube.com/embed/FvPSGhX_6_k" },
        { category: "buz", src: "https://www.youtube.com/embed/TsQK6foVyoM" },
        { category: "buz", src: "https://www.youtube.com/embed/xCRJR77I-f8" },
        { category: "buz", src: "https://www.youtube.com/embed/rzRnC3ZDfkU" },
        { category: "buz", src: "https://www.youtube.com/embed/H9A_4Hgfr8Y" },
        { category: "buz", src: "https://www.youtube.com/embed/m5X1ihsWaQ0" },
        
        // Jet Kategorisi
        { category: "jet", src: "https://www.youtube.com/embed/DaPB36FptsI" },
        { category: "jet", src: "https://www.youtube.com/embed/f_UytxQT76Q" },
        { category: "jet", src: "https://www.youtube.com/embed/pJeupSN_FhU" },
        
        // Sis Kategorisi
        { category: "sis", src: "https://www.youtube.com/embed/pJeupSN_FhU" },
        
        // Konfeti Kategorisi
        { category: "konfeti", src: "https://www.youtube.com/embed/POV94M5Yzho" },
        { category: "konfeti", src: "https://www.youtube.com/embed/iwDEKzESxuY" },
        { category: "konfeti", src: "https://www.youtube.com/embed/vwBC96--oQ0" },
		
  // balon Kategorisi
  { category: "balon", src: "https://www.youtube.com/embed/K0WiqhieSyY" },
  { category: "balon", src: "https://www.youtube.com/embed/oAB9r_caTBI" },
  { category: "balon", src: "https://www.youtube.com/embed/int6n6qGN9M" },
  { category: "balon", src: "https://www.youtube.com/embed/sndOpUNOU_Q" },
  { category: "balon", src: "https://www.youtube.com/embed/3lhZ1jzi-9I" },
  { category: "balon", src: "https://www.youtube.com/embed/vlDPgJSC0RY" }
		
		
    ];

    const galleryContainer = document.querySelector(".video-gallery");

    // Her video için thumbnail ve container oluştur
    videoData.forEach(video => {
        const videoId = video.src.split("/").pop();
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        const videoItem = document.createElement("div");
        videoItem.classList.add("video-item", video.category);
        videoItem.setAttribute("data-src", video.src);

        const img = document.createElement("img");
        img.src = thumbnailUrl;
        img.alt = "Video Thumbnail";
        img.classList.add("video-thumbnail");

        videoItem.appendChild(img);
        galleryContainer.appendChild(videoItem);
    });

    // Popup oluştur
    const popupOverlay = document.createElement("div");
    popupOverlay.id = "video-popup-overlay";
    popupOverlay.style.display = "none";
    popupOverlay.style.position = "fixed";
    popupOverlay.style.top = "0";
    popupOverlay.style.left = "0";
    popupOverlay.style.width = "100%";
    popupOverlay.style.height = "100%";
    popupOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    popupOverlay.style.justifyContent = "center";
    popupOverlay.style.alignItems = "center";
    popupOverlay.style.zIndex = "9999";

    const iframe = document.createElement("iframe");
    iframe.id = "popup-video";
    iframe.width = "80%";
    iframe.height = "80%";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "");

    popupOverlay.appendChild(iframe);
    document.body.appendChild(popupOverlay);

    // Popup'ı kapatma
    popupOverlay.addEventListener("click", (e) => {
        if (e.target === popupOverlay) {
            iframe.src = "";
            popupOverlay.style.display = "none";
        }
    });

    // Video tıklamalarını dinle
    document.addEventListener("click", (e) => {
        const videoItem = e.target.closest(".video-item");
        if (videoItem) {
            const videoSrc = videoItem.getAttribute("data-src");
            iframe.src = `${videoSrc}?autoplay=1&rel=0`;
            popupOverlay.style.display = "flex";
        }
    });
});
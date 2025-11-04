// script.js
import { pohonData } from './data.js';

const apiKey = '1a610303c3b5897c08b780b0aeb7e46a';

const map = L.map('map').setView([-7.3942, 112.7338], 15);
const markerGroup = L.featureGroup().addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

const detailsPanel = document.getElementById('details-content');

// --- IKON BARU BERDASARKAN JENIS POHON ---
const iconPalem = L.icon({
    iconUrl: 'icon-palem.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

const iconPulai = L.icon({
    iconUrl: 'icon-pulai.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

const iconTrembesi = L.icon({
    iconUrl: 'icon-trembesi.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

// "Peta" untuk memilih ikon (Kunci sudah diperbaiki)
const iconMap = {
    'Pohon Palem': iconPalem,
    'Pohon Pulai': iconPulai,
    'Pohon Trembesi': iconTrembesi
};

// Ikon default jika jenis_pohon tidak cocok
const defaultIcon = L.icon({
    iconUrl: 'icon.png', // Pastikan file 'icon.png' masih ada
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});
// ---------------------------------------------

async function getWeatherData(lat, lon) {
    if (!apiKey) {
        console.error('API key tidak ditemukan.');
        return null;
    }
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        const pollutionResponse = await fetch(pollutionUrl);
        const pollutionData = await pollutionResponse.json();

        // Data Cuaca
        const suhu = weatherData.main.temp;
        const kelembapan = weatherData.main.humidity;
        const tekanan = weatherData.main.pressure;
        const kecepatanAngin = weatherData.wind.speed;
        const arahAngin = weatherData.wind.deg;
        const deskripsiCuaca = weatherData.weather[0].description;
        const curahHujan = weatherData.rain ? weatherData.rain['1h'] : 'Tidak ada';
        const lokasiData = weatherData.name;

        // Data Polusi
        const polusi = pollutionData.list[0].components;

        return { 
            suhu, kelembapan, tekanan, kecepatanAngin, arahAngin,
            deskripsiCuaca, curahHujan, lokasiData, polusi 
        };
    } catch (error) {
        console.error('Terjadi kesalahan saat mengambil data dari API:', error);
        return null;
    }
}

pohonData.forEach(async data => {
    // Pengecekan jika lat atau lon tidak ada (null)
    if (!data.lat || !data.lon) {
        console.warn(`Data pohon "${data.nama}" tidak memiliki koordinat, marker dilewati.`);
        return; // Lewati data ini dan jangan buat marker
    }

    const apiData = await getWeatherData(data.lat, data.lon);
    
    // --- INI BAGIAN YANG DIPERBAIKI ---
    // Pilih ikon berdasarkan data.jenis_pohon, atau gunakan defaultIcon jika tidak cocok
    const selectedIcon = iconMap[data.jenis_pohon] || defaultIcon;
    const marker = L.marker([data.lat, data.lon], { icon: selectedIcon });
    // ---------------------------------
    
    // Popup Content
    let popupContent = `
        <b>${data.jenis_pohon}</b><br>
        <b>${data.nama}</b><br>
        Keliling: ${data.keliling_pohon} cm<br>
        Diameter: ${data.diameter_pohon} cm
    `;
    if (apiData) {
        popupContent += `<br>Suhu: ${apiData.suhu}°C`;
    }
    marker.bindPopup(popupContent);
    
    // Event Klik
    marker.on('click', function() {
        displayDetails(data, apiData);
    });
    marker.addTo(markerGroup);
});

// Fit map bounds
if (pohonData.length > 0) {
    const validPohonData = pohonData.filter(d => d.lat && d.lon);
    
    if (validPohonData.length > 0) {
        const lats = validPohonData.map(d => d.lat);
        const lons = validPohonData.map(d => d.lon);
        const bounds = L.latLngBounds(L.latLng(Math.min(...lats), Math.min(...lons)), L.latLng(Math.max(...lats), Math.max(...lons)));
        map.fitBounds(bounds);
        
        const firstData = validPohonData[0];
        getWeatherData(firstData.lat, firstData.lon).then(apiData => {
            displayDetails(firstData, apiData);
        });
    }
}

function displayDetails(data, apiData) {
    detailsPanel.innerHTML = '';

    // Card 1: Informasi Pohon
    const pohonCard = document.createElement('div');
    pohonCard.className = 'info-card';
    pohonCard.innerHTML = `
        <h3>Informasi ${data.jenis_pohon}</h3>
        <p><b>Nama Pohon:</b> ${data.nama}</p>
        <p><b>Keliling Pohon:</b> ${data.keliling_pohon} cm</p>
        <p><b>Diameter Pohon:</b> ${data.diameter_pohon} cm</p>
        <p><b>Biomassa Pohon:</b> ${data.biomassa_pohon} kg</p>
        <p><b>Simpanan Karbon:</b> ${data.simpanan_karbon} kg</p>
        <p><b>Serapan CO2 Ekivalin:</b> ${data.serapan_co2_ekivalin} kg</p>
        <p><b>Maps:</b> <a href="${data.gmaps_link}" target="_blank">Lihat di Google Maps</a></p>
    `;
    detailsPanel.appendChild(pohonCard);
    
    // Card 2: Rata-rata Serapan CO2 Tiap Wilayah
    const co2Card = document.createElement('div');
    co2Card.className = 'info-card';
    co2Card.innerHTML = `
        <h3>Rata-rata Serapan CO2 Tiap Wilayah</h3>
        <p style="font-size: 12px; color: #aaa; margin-top: -10px;">
            <br>
            <i>*Pengambilan sampel ini berada di 6 wilayah.</i>
        </p>
        <p><b>SERUNI:</b> 6,92 kg</p>
        <p><b>ALOHA:</b> 79.215 kg</p>
        <p><b>PSJ:</b> 27.120,25 kg</p>
        <p><b>A.YANI:</b> 3,76 kg</p>
        <p><b>SAGED:</b> 354,23 kg</p>
        <p><b>GEDANGAN:</b> 15.847.297,032 kg</p>
    `;
    detailsPanel.appendChild(co2Card);

    if (apiData) {
        // Card 3: Data Cuaca Sekitar Pohon
        const cuacaCard = document.createElement('div');
        cuacaCard.className = 'info-card';
        cuacaCard.innerHTML = `
            <h3>Data Cuaca Sekitar Pohon</h3>
            <p><b>Lokasi Data:</b> ${apiData.lokasiData}</p>
            <p><b>Suhu Udara:</b> ${apiData.suhu}°C</p>
            <p><b>Kelembapan:</b> ${apiData.kelembapan}%</p>
            <p><b>Tekanan Udara:</b> ${apiData.tekanan} hPa</p>
            <p><b>Kecepatan Angin:</b> ${apiData.kecepatanAngin} m/s</p>
            <p><b>Arah Angin:</b> ${apiData.arahAngin}°</p>
            <p><b>Kondisi Cuaca:</b> ${apiData.deskripsiCuaca}</p>
            <p><b>Curah Hujan:</b> ${apiData.curahHujan} mm</p>
        `;
        detailsPanel.appendChild(cuacaCard);

        // Card 4: Data Polusi Udara
        const polusiCard = document.createElement('div');
        polusiCard.className = 'info-card';
        polusiCard.innerHTML = `
            <h3>Data Polusi Udara</h3>
            <p><b>CO:</b> ${apiData.polusi.co} µg/m³</p>
            <p><b>NO:</b> ${apiData.polusi.no} µg/m³</p>
            <p><b>NO₂:</b> ${apiData.polusi.no2} µg/m³</p>
            <p><b>O₃:</b> ${apiData.polusi.o3} µg/m³</p>
            <p><b>SO₂:</b> ${apiData.polusi.so2} µg/m³</p>
            <p><b>NH₃:</b> ${apiData.polusi.nh3} µg/m³</p>
            <p><b>PM2.5:</b> ${apiData.polusi.pm2_5} µg/m³</p>
            <p><b>PM10:</b> ${apiData.polusi.pm10} µg/m³</p>
        `;
        detailsPanel.appendChild(polusiCard);
    }
}

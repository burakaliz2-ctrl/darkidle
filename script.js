const game = {
    res: { wood: 0, food: 50, water: 50, scrap: 0 },
    inv: { medkit: 1 },
    stats: { health: 100, hunger: 100, thirst: 100 },
    // auto içine 'def' (savunma) eklendi
    auto: { wood: 0, scrap: 0, autoEat: 0, autoDrink: 0, def: 0 }, 
    prestige: 0,
    finalProg: 0,
    time: 480, 
    temp: 22,
    isNight: false,
    weather: "Açık",
	isCollecting: false, // Tıklama spamını engellemek için kontrol
    init() {
        this.load();
        this.applyAtmosphere();
        this.updateUI();
        setInterval(() => this.tick(), 1000);
        this.log("Sistem Aktif: v5.5 Savunma Hattı Hazır.");
    },

    collect(type, amount) {
		if (this.isCollecting) return;
		this.isCollecting = true; // Kilidi kapat
        const bonusAmount = amount + (this.prestige * 2);
        this.res[type] += bonusAmount;
        this.log(`${bonusAmount} ${type} toplandı.`);
        if (Math.random() < 0.15) this.triggerDiscovery();
        this.updateUI();
		const buttons = document.querySelectorAll('.btn-collect');
        buttons.forEach(btn => btn.style.opacity = "0.5");
		// 800ms (0.8 saniye) sonra kilidi aç
        setTimeout(() => {
            this.isCollecting = false;
            buttons.forEach(btn => btn.style.opacity = "1");
        }, 800);
    },

    triggerDiscovery() {
        const events = [
            { m: "Terk edilmiş bir çanta! (+1 Kit)", f: () => this.inv.medkit++ },
            { m: "Kaza geçirdin. (-10 Sağlık)", f: () => this.stats.health -= 10 },
            { m: "Zulalanmış konserve! (+15 Yemek)", f: () => this.res.food += 15 },
            { m: "EFSANEVİ: Antik bir radyo parçası buldun!", f: () => { 
                this.finalProg += 10; 
                this.log("ANTİK PARÇA: Kule onarımı %10 ilerledi!", "success");
            }}
        ];
        const e = events[Math.floor(Math.random() * events.length)];
        e.f();
        this.log("KEŞİF: " + e.m, "success");
    },

    applyAtmosphere() {
        const hue = (this.prestige * 45) % 360; 
        const brightness = Math.max(0.6, 1 - (this.prestige * 0.05));
        const saturate = 1 + (this.prestige * 0.1);
        document.body.style.filter = `hue-rotate(${hue}deg) brightness(${brightness}) saturate(${saturate})`;
        
        const colors = ["Mavi", "Yeşil", "Sarı", "Turuncu", "Kırmızı", "Mor"];
        const colorName = colors[this.prestige % colors.length];
        this.log(`BÖLGE ETKİSİ: ${colorName} Atmosfer devrede.`, "info");
    },

    tick() {
        this.time += 5;
        const currentHour = (Math.floor(this.time / 60) % 24);
        this.isNight = (currentHour >= 20 || currentHour < 6);

        // --- Hava Durumu Kontrolü ---
        if (this.time % 120 === 0) {
            const roll = Math.random();
            if (roll > 0.85) {
                this.weather = "Fırtınalı";
                this.log("UYARI: Şiddetli fırtına başladı!", "danger");
            } else if (roll > 0.65) {
                this.weather = "Yağmurlu";
                this.log("BİLGİ: Yağmur yağmaya başladı.");
            } else {
                this.weather = "Açık";
                if (roll < 0.1) this.log("BİLGİ: Gökyüzü açılıyor.");
            }
        }

        // --- GECE BASKINI SİSTEMİ ---
        if (this.isNight && this.time % 60 === 0 && Math.random() < 0.20) {
            this.triggerRaid();
        }

        // --- Zorluk ve Üretim ---
        const difficulty = 1 + (this.prestige * 0.1);
        this.stats.hunger = Math.max(0, this.stats.hunger - (0.2 * difficulty));
        this.stats.thirst = Math.max(0, this.stats.thirst - (0.4 * difficulty));

        let weatherMultiplier = this.weather === "Fırtınalı" ? 0.4 : (this.weather === "Yağmurlu" ? 0.7 : 1.0);
        this.res.wood += (this.auto.wood * 0.4) * weatherMultiplier;
        this.res.scrap += (this.auto.scrap * 0.2) * weatherMultiplier;

        // Otomatik Tüketim
        if (this.auto.autoEat > 0 && this.stats.hunger < 30 && this.res.food >= 5) { this.eat(); this.log("OTOMATİK: Yemek yendi.", "success"); }
        if (this.auto.autoDrink > 0 && this.stats.thirst < 30 && this.res.water >= 5) { this.drink(); this.log("OTOMATİK: Su içildi.", "success"); }

        if (this.isNight && this.temp < 0) this.stats.health -= 1;
        if (this.stats.health <= 0) { alert("Öldün!"); this.reset(); }
        
        this.updateUI();
    },

    triggerRaid() {
        const raidPower = (this.prestige + 1) * 15;
        const defensePower = this.auto.def * 20;

        if (defensePower < raidPower) {
            const lostWood = Math.floor(this.res.wood * 0.1);
            this.res.wood -= lostWood;
            this.stats.health -= 10;
            this.log(`BASKIN: Savunma aşıldı! ${lostWood} Odun kaybettin.`, "danger");
            // Kırmızı Flaş Efekti
            document.body.style.backgroundColor = "rgba(255,0,0,0.5)";
            setTimeout(() => document.body.style.backgroundColor = "", 300);
        } else {
            this.log("SAVUNMA: Gece saldırısı püskürtüldü!", "success");
        }
    },

    updateUI() {
        const pTag = document.getElementById('prestige-tag');
        if(pTag) pTag.innerText = `[SEVİYE ${this.prestige}]`;

        document.getElementById('res-wood').innerText = Math.floor(this.res.wood);
        document.getElementById('res-food').innerText = Math.floor(this.res.food);
        document.getElementById('res-water').innerText = Math.floor(this.res.water);
        document.getElementById('res-scrap').innerText = Math.floor(this.res.scrap);
        document.getElementById('inv-medkit').innerText = this.inv.medkit;

        const bar = (id, v) => {
            const element = document.getElementById(`bar-${id}`);
            const text = document.getElementById(`val-${id}`);
            if(element) element.style.width = v + "%";
            if(text) text.innerText = Math.ceil(v);
        };
        bar('health', this.stats.health); bar('hunger', this.stats.hunger); bar('thirst', this.stats.thirst);

        // Yapı seviyeleri ve maliyetleri
        const buildings = ['wood', 'scrap', 'autoEat', 'autoDrink', 'def'];
        buildings.forEach(t => {
            const cost = this.getCost(t);
            const lvlEl = document.getElementById(`lvl-${t}`);
            const costEl = document.getElementById(`cost-${t}`);
            if(lvlEl) lvlEl.innerText = this.auto[t];
            if(costEl) costEl.innerText = `${cost.wood}W, ${cost.scrap}S`;
        });

        const h = Math.floor(this.time / 60) % 24;
        const m = Math.floor(this.time % 60);
        document.getElementById('game-time').innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const weatherIcons = {"Açık": "fa-sun", "Yağmurlu": "fa-cloud-showers-heavy", "Fırtınalı": "fa-bolt"};
        const weatherText = document.getElementById('weather-text');
        if(weatherText) weatherText.innerHTML = `<i class="fas ${weatherIcons[this.weather]}"></i> ${this.weather}`;
        
        document.getElementById('game-temp').innerText = Math.floor(this.temp) + "°C";
        document.getElementById('final-percent').innerText = this.finalProg + "%";
        document.getElementById('bar-final').style.width = this.finalProg + "%";

        // Efektler
        document.body.classList.toggle('night-mode', this.isNight);
        document.body.classList.toggle('rain-mode', this.weather === "Yağmurlu");
        document.body.classList.toggle('storm-mode', this.weather === "Fırtınalı");

        const nightWarning = document.getElementById('night-warning');
        if (nightWarning) nightWarning.className = (this.isNight && this.temp < 5) ? "env-warning" : "hidden";
    },

    getCost(t) {
        const l = this.auto[t];
        let base = t.includes('auto') ? {w:60, s:40} : {w:25, s:15};
        if (t === 'def') base = {w:40, s:25}; // Barikat maliyeti
        return { wood: Math.floor(base.w * Math.pow(1.7, l)), scrap: Math.floor(base.s * Math.pow(1.7, l)) };
    },

    upgrade(t) {
        const c = this.getCost(t);
        if (this.res.wood >= c.wood && this.res.scrap >= c.scrap) {
            this.res.wood -= c.wood; this.res.scrap -= c.scrap;
            this.auto[t]++;
            this.log(t + " geliştirildi!", "success");
        } else this.log("Yetersiz hammadde!", "danger");
        this.updateUI();
    },

    eat() { if(this.res.food >= 5) { this.res.food -= 5; this.stats.hunger = Math.min(100, this.stats.hunger + 30); } this.updateUI(); },
    drink() { if(this.res.water >= 5) { this.res.water -= 5; this.stats.thirst = Math.min(100, this.stats.thirst + 40); } this.updateUI(); },
    useMedkit() { if(this.inv.medkit > 0) { this.inv.medkit--; this.stats.health = Math.min(100, this.stats.health + 40); } this.updateUI(); },

    repairFinal() {
        if(this.res.wood >= 100 && this.res.scrap >= 100) {
            this.res.wood -= 100; this.res.scrap -= 100; this.finalProg += 5;
            if(this.finalProg >= 100) this.ascend();
        } else this.log("Yetersiz kaynak!", "danger");
        this.updateUI();
    },

    ascend() {
        this.prestige++;
        const bonus = this.prestige * 20; 
        alert(`BÖLGE TAMAMLANDI! Seviye ${this.prestige} başlıyor.`);
        this.res = { wood: 20 + bonus, food: 50 + bonus, water: 50 + bonus, scrap: 10 + bonus };
        this.auto = { wood: 0, scrap: 0, autoEat: 0, autoDrink: 0, def: 0 };
        this.stats = { health: 100, hunger: 100, thirst: 100 };
        this.finalProg = 0; this.time = 480; this.weather = "Açık"; this.isNight = false;
        document.body.classList.remove('night-mode', 'storm-mode', 'rain-mode');
        this.applyAtmosphere();
        this.save();
        this.updateUI();
    },

    switchTab(tab, e) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.remove('hidden');
        if(e) e.target.classList.add('active');
    },

    log(msg, type = "info") {
        const l = document.getElementById('log');
        const d = document.createElement('div');
        d.className = 'log-item';
        if(type === "danger") d.style.borderLeftColor = "#ef4444";
        if(type === "success") d.style.borderLeftColor = "#10b981";
        d.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString('tr-TR')}]</span> ${msg}`;
        l.prepend(d);
        if (l.childNodes.length > 30) l.removeChild(l.lastChild);
    },

    save() { 
        const data = {res:this.res, stats:this.stats, auto:this.auto, final:this.finalProg, time:this.time, inv:this.inv, prestige:this.prestige};
        localStorage.setItem('dark_survival_v5_final', JSON.stringify(data)); 
        this.log("Kaydedildi.", "success"); 
    },
    load() { 
        const d = JSON.parse(localStorage.getItem('dark_survival_v5_final')); 
        if(d) Object.assign(this, d); 
    },
    reset() { if(confirm("Sıfırlansın mı?")) { localStorage.removeItem('dark_survival_v5_final'); location.reload(); } }
};

window.onload = () => game.init();
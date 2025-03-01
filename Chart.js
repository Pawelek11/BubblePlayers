var ctx = document.getElementById("myLineChart").getContext('2d');
let playersMS1 = [];
let playersHC = [];
let currentData;
let myLineChart;
let time;

    fetch('https://api.codetabs.com/v1/proxy?quest=https://bubbleam.pl/players')
        .then(response => {
            if(!response.ok){
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            return response.text();
        })
        .then(csv => {
            const stats = csv.split('\n');
            stats.forEach(el => {
                if(el.indexOf(',') == -1) {
                    time = parseInt(el);
                    playersMS1.push([time, 0]);
                }
                else {
                    ammountArr = el.split(',').map(Number);
                    ammountArr.forEach(elem => {
                        time += 60000;
                        playersMS1.push([time, elem]);
                    })
                }
            });
            playersMS1 = playersMS1.filter(t => t[0]>1000000000000);
            //const colorOfDay = ['red', 'yellow', 'pink', 'orange', 'purple', 'green', 'blue'];
            //const colorOfDay = ['#ff4c4c', '#ffcc00', '#ff66b2', '#ff884d', '#b266ff', '#33cc33', '#3399ff'];
            //const colorOfDay = ['#ff1744', '#ffea00', '#f50057', '#ff6d00', '#d500f9', '#00e676', '#2979ff'];
            const colorOfDay = ['rgba(255, 71, 71, 0.8)', 'rgba(255, 230, 0, 0.8)', 'rgba(255, 51, 153, 0.8)', 
                'rgba(255, 102, 51, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(51, 204, 51, 0.8)', 
                'rgba(51, 153, 255, 0.8)'];
            myLineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: playersMS1.map(item => new Date(item[0])),     //Oś x MS1
                    datasets: [{
                        data: playersMS1.map(item => item[1]),    //Oś x MS1
                        borderColor: '#00bcd4', // Kolor linii
                        backgroundColor: 'rgba(0, 188, 212, 0.2)', 
                        borderWidth: 1,
                        pointRadius: 0,     // wielkość punktów wartości Y
                        fill: false,
                        spanGaps: true,  //pozwala na przerwy danych
                        cubicInterpolationMode: 'monotone',
                        segment: {                              // Segmentacja wykresu, zmiana koloru linii wykresu
                            borderColor: (ctx) => {
                                const index = ctx.p0.$context.dataIndex; // Uzyskanie indeksu punktu
                                const label = ctx.chart.data.labels[index]; // Uzyskanie etykiety z indeksu punktu
                                const date = new Date(label); // Tworzenie obiektu Date z etykiety
                                const dayOfWeek = date.getDay(); // Pobranie dnia tygodnia (0 = niedziela, 1 = poniedziałek, ..., 6 = sobota)
                                return colorOfDay[dayOfWeek];
                            },
                        }
                    },]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {                    //etykiety
                                maxTicksLimit: 30,
                                color: (context) => colorOfDay[new Date(context.tick['label']).getDay()]
                            },
                            grid: {
                                color: '#444' 
                            },
                            font: {
                                size: 12
                            },
                        type: 'time',
                        time: {
                                tooltipFormat: 'dd MMM yyyy HH:mm',         // format wyświetlania w podpowiedzi
                                displayFormats: {                           // // format wyświetlania etykiet, dobierany automatycznie przez wykres
                                    day: 'dd MMM yyyy ',
                                    hour: 'dd MMM yyyy',          // format wyświetlania godzin
                                    minute: 'dd MMM HH:mm',
                                },
                            },
                        },
                        y: {
                            ticks: {                    //etykiety
                                beginAtZero: true,
                                color: '#ffffff' // Kolor etykiet na osi Y
                            },
                            grid: {
                                color: '#444' // Kolor siatki na osi Y
                            },
                            title: {
                                display: true,
                                text: 'Number of Players'
                            },
                            min: 0
                        }
                    },
                    interaction: {
                        mode: 'nearest',        //najbliższy punkt
                        axis: 'x',              //przesuwanie kursora po osi X
                        intersect: false        //Tooltipy pojawiają się nie tylko nad punktami danych
                    },
                    tooltips: {
                        enabled: true,
                        backgroundColor: '#333', // Ciemne tło
                        titleColor: '#ffffff',   // Biały tekst tytułu
                        bodyColor: '#ffffff'     // Biały tekst tooltipa
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        zoom: { 
                            limits: {
                                x: {
                                    min: 'original', max: 'original', minRange:  6 * 60 * 60 * 1000 // Zakres powiększania, min 6*60*60*1000ms = 6h
                                }
                            },
                            pan: {
                                enabled: true,
                                mode: 'x',
                            },
                            zoom: { 
                                
                                wheel: { 
                                      enabled: true,
                                      mode: 'x',
                                    speed: 0.5,
                                    sensitivity: 1,
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'x',
                            }
                        }
                    }
                }
            });
            
            currentData = playersMS1;
        })
    .catch(error => console.error('Błąd pobierania danych:', error));

document.getElementById('MS1').classList.add('active');         //oznaczenie przycisku MS1 jako wciśniętego

let hourlyData = {};      //obiekt z godziną i średnią ilością grraczy 
let Labels2;
function averagePerHour(numberHourToAverage) {
    hourlyData = {};
    let currentHourKey = null;  // godzina dla której obliczamy średnią
    let currentHourPlayers = [];

    currentData.forEach(entry => {
        const hourKey = Math.floor(entry[0] / 3600000);             // hourKey to całkowita liczba godzin z timestamps
        if (currentHourKey === null) currentHourKey = hourKey;
        if (hourKey - currentHourKey < numberHourToAverage) {
            currentHourPlayers.push(entry[1]);             // Dodajemy liczba graczy do bieżącej godziny
        }
        else {
            if (currentHourKey !== null) {          // Jeśli zmienia się godzina, obliczamy średnią dla poprzedniej godziny
                const totalPlayers = currentHourPlayers.reduce((sum, num) => sum + num, 0);
                const averagePlayers = totalPlayers / currentHourPlayers.length;
                hourlyData[currentHourKey] = averagePlayers; // Przechowujemy średnią dla poprzedniej godziny
            }
            // Resetujemy dla nowej godziny
            currentHourKey = hourKey;
            currentHourPlayers = [];
            currentHourPlayers.push(entry[1]); // Dodajemy liczba graczy do bieżącej godziny
        }
    });

    if (currentHourPlayers.length > 0) {                        //liczenie średniej dla ostatniej godziny
        const totalPlayers = currentHourPlayers.reduce((sum, num) => sum + num, 0);
        const averagePlayers = totalPlayers / currentHourPlayers.length;
        hourlyData[currentHourKey] = averagePlayers;
    }

    Labels2 = Object.keys(hourlyData).map(hourkey => {        //tworzenie etykiety dla osi x
        return new Date(hourkey * 3600000);
    });
};

const topButtons = document.querySelectorAll('.top-buttons .btn');
const bottomButtons = document.querySelectorAll('.bottom-buttons .btn');

function topBtnAction(players, activeBtn) {
    myLineChart.data.labels = players.map(item => new Date(item[0]));
    myLineChart.data.datasets[0].data = players.map(item => item[1]);
    topButtons.forEach(b => b.classList.remove('active'));
    bottomButtons.forEach(b => b.classList.remove('active'));
    myLineChart.resetZoom();
    myLineChart.update();
    currentData = players;
    document.getElementById(activeBtn).classList.add('active');
};

function bottomBtnAction(numAvgHour, activeBtn) {
    bottomButtons.forEach(b => b.classList.remove('active'));
    document.getElementById(activeBtn).classList.add('active');
    myLineChart.resetZoom();
    averagePerHour(numAvgHour);
    myLineChart.data.datasets[0].data = Object.values(hourlyData);
    myLineChart.data.labels = Labels2;
    myLineChart.update();
};
    document.getElementById('MS1').addEventListener('click', () => {
        topBtnAction(playersMS1, 'MS1');
    });

    const bottomButton = document.querySelectorAll('.bottom-buttons button');
    bottomButton.forEach((butt => {
        butt.addEventListener('click',() => {
            let hn = butt.getAttribute('hn');
            bottomBtnAction(parseInt(hn), butt.id);
        })
    }));
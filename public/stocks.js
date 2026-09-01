// 500-stock seed list — mix of S&P 500, NASDAQ 100, and international names
// eslint-disable-next-line no-var
var STOCKS = [
  // Mega-cap tech
  "AAPL","MSFT","NVDA","GOOGL","GOOG","AMZN","META","TSLA","AVGO","ORCL",
  "ASML","TSM","AMD","QCOM","INTC","TXN","MU","AMAT","LRCX","KLAC",
  // Financials
  "BRK-B","JPM","V","MA","BAC","WFC","GS","MS","C","AXP",
  "BLK","SCHW","CB","MMC","ICE","CME","SPGI","MCO","AON","TRV",
  // Healthcare
  "LLY","UNH","JNJ","ABBV","MRK","TMO","ABT","DHR","AMGN","PFE",
  "BMY","GILD","ISRG","SYK","MDT","ELV","CVS","HUM","CI","COR",
  // Consumer
  "WMT","COST","HD","MCD","NKE","SBUX","TGT","LOW","TJX","ROST",
  "DG","DLTR","KR","SYY","HSY","MKC","GIS","K","CPB","CAG",
  // Energy
  "XOM","CVX","COP","SLB","EOG","PXD","MPC","PSX","VLO","OXY",
  "HAL","BKR","DVN","FANG","HES","MRO","APA","CTRA","OVV","SM",
  // Industrials
  "GE","CAT","DE","HON","RTX","LMT","BA","NOC","GD","LHX",
  "MMM","EMR","ETN","PH","ROK","ITW","DOV","ROP","CARR","OTIS",
  // Comm services
  "NFLX","DIS","CMCSA","T","VZ","TMUS","WBD","PARA","FOX","FOXA",
  "SNAP","PINS","MTCH","IAC","ZG","ANGI","TRIP","EXPE","BKNG","ABNB",
  // Materials
  "LIN","APD","SHW","ECL","NEM","FCX","NUE","STLD","CF","MOS",
  "ALB","EMN","PPG","RPM","HUN","OLN","AXTA","AVNT","GRA","WLK",
  // Real estate
  "AMT","PLD","EQIX","CCI","PSA","O","WELL","DLR","SPG","EQR",
  "AVB","MAA","UDR","ESS","CPT","NNN","STOR","VICI","MGM","WYNN",
  // Utilities
  "NEE","DUK","SO","D","AEP","EXC","SRE","PCG","XEL","ED",
  "WEC","ES","FE","ETR","EIX","PPL","CMS","DTE","AES","NRG",
  // Small/mid cap growth
  "ENPH","SEDG","RUN","NOVA","FSLR","PLUG","BE","BLNK","CHPT","EVGO",
  "RIVN","LCID","FSR","GOEV","NKLA","WKHS","RIDE","HYLN","REE","SOLO",
  // Software
  "CRM","NOW","ADBE","INTU","WDAY","TEAM","ZS","CRWD","PANW","OKTA",
  "SNOW","DDOG","MDB","ESTC","SPLK","VEEV","HUBS","COUP","PCTY","PAYC",
  // SaaS / cloud
  "NET","CFLT","GTLB","BILL","DOCN","APPN","BOX","DBX","SMAR","ALTR",
  "JAMF","BRZE","RDDT","HOOD","SOFI","AFRM","UPST","LMND","ROOT","HIG",
  // Semis
  "MRVL","MCHP","ADI","NXPI","ON","WOLF","SWKS","QRVO","MPWR","ENTG",
  "AMKR","CRUS","DIOD","SLAB","SIMO","RMBS","COHU","FORM","ACLS","UCTT",
  // Biotech
  "MRNA","BNTX","REGN","VRTX","BIIB","ALNY","INCY","EXAS","HALO","FATE",
  "BEAM","EDIT","NTLA","CRSP","BLUE","AGEN","CLVS","ACAD","ARWR","PTCT",
  // ETFs (useful for macro practice)
  "SPY","QQQ","IWM","DIA","GLD","SLV","USO","TLT","HYG","LQD",
  "EEM","EFA","VEA","VWO","IEFA","IAU","PDBC","DBC","UNG","BOIL",
  // International ADRs
  "BABA","JD","PDD","BIDU","NIO","XPEV","LI","TME","BILI","IQ",
  "MELI","NU","GLOB","DESP","ARCO","CPAC","VLRS","VNET","CAN","CLFD",
  // More S&P names
  "PG","KO","PEP","CL","PM","MO","BTI","UL","MDLZ","CHD",
  "EL","COTY","REV","NWSA","NWS","NYT","GCI","OMC","IPG","WPP",
  // More financials
  "USB","PNC","TFC","FITB","KEY","RF","HBAN","CFG","MTB","CMA",
  "SIVB","WAL","FRC","PACW","BANC","OFG","TCBI","HOPE","IBTX","SBNY",
  // More tech hardware
  "HPQ","HPE","DELL","WDC","STX","NTAP","PSTG","NTNX","SMCI","VNET",
  "CDW","LDOS","SAIC","CACI","CSCO","JNPR","ANET","FFIV","NTGR","CALX",
  // Misc growth
  "ABNB","DASH","LYFT","UBER","COIN","SQ","PYPL","AFRM","SHOP","ETSY",
  "W","CHWY","PETQ","ZM","DOCU","DOCN","TWLO","FSLY","VCSY","WEAV",
];

// Deduplicate — exposed as a global for the renderer
// Also supports require() for any Node scripts
const _uniqueStocks = [...new Set(STOCKS)].slice(0, 500);
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _uniqueStocks;
} else {
  // Browser/renderer context — reassign to cleaned array
  STOCKS.length = 0;
  _uniqueStocks.forEach(s => STOCKS.push(s));
}

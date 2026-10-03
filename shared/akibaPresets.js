// 秋葉注のプリセット初期値。Firebase の presets が空のときに使う。
// Web 版 public/akiba-chu.html の DEFAULT_PRESETS から抽出した同一データ。
export const DEFAULT_PRESETS = {
  passive: {
    label: '受動部品',
    items: [
      {name:'1kΩ 抵抗', unit:'本', icon:'≈', url:'https://akizukidenshi.com/catalog/g/g109948/'},
      {name:'10kΩ 抵抗', unit:'本', icon:'≈', url:'https://akizukidenshi.com/catalog/g/g109944/'},
      {name:'100Ω 抵抗', unit:'本', icon:'≈', url:'https://akizukidenshi.com/catalog/g/g109951/'},
      {name:'100kΩ 抵抗', unit:'本', icon:'≈', url:'https://akizukidenshi.com/catalog/g/g109945/'},
      {name:'0.1μF セラコン', unit:'個', icon:'⊟', url:'https://akizukidenshi.com/catalog/g/g102151/'},
      {name:'10μF 電解C', unit:'個', icon:'⊟', url:'https://akizukidenshi.com/catalog/g/g100098/'},
      {name:'1N4148', unit:'個', icon:'▷', url:'https://akizukidenshi.com/catalog/g/g100941/'},
      {name:'LED 赤', unit:'個', icon:'◉', url:'https://akizukidenshi.com/catalog/g/g111577/'},
      {name:'LED 緑', unit:'個', icon:'◉', url:'https://akizukidenshi.com/catalog/g/g111578/'},
    ]
  },
  active: {
    label: '能動部品・IC',
    items: [
      {name:'ICソケット 8pin', unit:'個', icon:'□', url:'https://akizukidenshi.com/catalog/g/g106786/'},
      {name:'ICソケット 14pin', unit:'個', icon:'□', url:'https://akizukidenshi.com/catalog/g/g106787/'},
      {name:'ICソケット 16pin', unit:'個', icon:'□', url:'https://akizukidenshi.com/catalog/g/g106788/'},
      {name:'ICソケット 28pin', unit:'個', icon:'□', url:'https://akizukidenshi.com/catalog/g/g106789/'},
      {name:'74HC04', unit:'個', icon:'IC', url:'https://akizukidenshi.com/catalog/g/g100166/'},
      {name:'NE555', unit:'個', icon:'IC', url:'https://akizukidenshi.com/catalog/g/g107972/'},
    ]
  },
  board: {
    label: '基板・配線',
    items: [
      {name:'ユニバ基板 小', unit:'枚', icon:'⊞', url:'https://akizukidenshi.com/catalog/g/g100517/'},
      {name:'ユニバ基板 中', unit:'枚', icon:'⊞', url:'https://akizukidenshi.com/catalog/g/g100518/'},
      {name:'ユニバ基板 大', unit:'枚', icon:'⊞', url:'https://akizukidenshi.com/catalog/g/g100519/'},
      {name:'配線材 赤', unit:'m', icon:'~', url:''},
      {name:'配線材 黒', unit:'m', icon:'~', url:''},
      {name:'配線材 各色', unit:'m', icon:'~', url:''},
      {name:'収縮チューブ', unit:'袋', icon:'|', url:''},
    ]
  },
  connector: {
    label: 'コネクタ',
    items: [
      {name:'ピンヘッダ 1×40', unit:'本', icon:'|||', url:'https://akizukidenshi.com/catalog/g/g101832/'},
      {name:'ピンヘッダ 2×20', unit:'本', icon:'|||', url:'https://akizukidenshi.com/catalog/g/g100020/'},
      {name:'ピンソケット 1×40', unit:'本', icon:'⊟', url:'https://akizukidenshi.com/catalog/g/g100263/'},
      {name:'XH コネクタ 2P', unit:'袋', icon:'⊢', url:''},
      {name:'XH コネクタ 3P', unit:'袋', icon:'⊢', url:''},
      {name:'JST PH 2P', unit:'袋', icon:'⊢', url:''},
    ]
  },
  tool: {
    label: '工具・消耗品',
    items: [
      {name:'はんだ 250g', unit:'本', icon:'∿', url:''},
      {name:'フラックス', unit:'個', icon:'◫', url:''},
      {name:'吸いとり線', unit:'個', icon:'◫', url:''},
      {name:'マスキングテープ', unit:'個', icon:'○', url:''},
    ]
  }
};


export default DEFAULT_PRESETS

export interface CoinPackage {
  coins: number;
  price: number; // THB
  label: string;
  bonus?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { coins: 50, price: 29, label: "50" },
  { coins: 100, price: 49, label: "100" },
  { coins: 300, price: 99, label: "300", bonus: "7%" },
  { coins: 500, price: 149, label: "500", bonus: "10%" },
  { coins: 1000, price: 249, label: "1,000", bonus: "15%" },
  { coins: 3000, price: 699, label: "3,000", bonus: "20%" },
  { coins: 5000, price: 1190, label: "5,000", bonus: "24%" },
  { coins: 10000, price: 1990, label: "10,000", bonus: "30%" },
  { coins: 30000, price: 4990, label: "30,000", bonus: "37%" },
  { coins: 50000, price: 6990, label: "50,000", bonus: "40%" },
  { coins: 100000, price: 12900, label: "100,000", bonus: "45%" },
  { coins: 300000, price: 34900, label: "300,000", bonus: "50%" },
];

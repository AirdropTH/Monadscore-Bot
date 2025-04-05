# Monadscrore Auto Reff & Node Updater
A fully automated bot designed to update Monadscorenode start times for multiple wallets using proxies. This bot ensures daily updates while logging execution details to prevent redundant requests.

## Features

- Automated Updates – Runs daily at 7 AM, ensuring wallets stay active.
- Proxy Support – Uses proxies from proxy.txt to enhance anonymity.
- Wallet Management – Reads and processes wallet addresses from wallets.txt
- Retry & Delay Mechanism – Implements randomized delays and retries to handle API failures smoothly.

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)


## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/AirdropTH/Monadscore-Bot.git
    cd Monadscore-Bot
    ```

2. Install the required dependencies:
    ```sh
    npm install
    ```

## 📝 Configuration

1. (Optional) Create a `proxies.txt` file for proxy support:
    ```
    http://user:pass@host:port
    socks5://user:pass@host:port
    ```

2. Create a `code.txt` file to input your referral code:
    ```sh
    nano code.txt
    ```
5. Run the script:
    ```sh
    node index.js
    ```

## Stay Connected

- Channel Telegram : [Telegram](https://t.me/AirdropToolkitHub)

## Contributing

Feel free to fork the repository and submit pull requests for any improvements.

## License

MIT License

## Disclaimer

This bot is for educational purposes only. Use at your own risk and ensure compliance with Flow3's terms of service.

## Donation

If you would like to support the development of this project, you can make a donation using the following addresses:

- Solana: `4RA5KKiBFUGRaFf1rnParuy1a6EP5PgeuaaHNzHBboYe`
- EVM: `0xD4f5137D3A5259D6bfccF613750cd5C7ed51cFFc`

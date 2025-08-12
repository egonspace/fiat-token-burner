const express = require('express');
const { ethers } = require('ethers'); // 이 라인은 그대로 둡니다.
const path = require('path');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const provider = new ethers.JsonRpcProvider('https://api.test.wemix.com');

// 시스템 지갑 설정 (서버에서 트랜잭션을 실행할 지갑)
// 경고: 실제 운영 환경에서는 개인키를 코드에 직접 하드코딩하지 마세요.
// 환경 변수나 보안 저장소를 사용해야 합니다.
const systemWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const tokenAddress = "0xe11288Fc3b1def3B61dBA65A5c5C96792032aac4"; // FiatGateway contract
const tokenAbi = [
    // 필요한 ABI만 포함
    "function burnForFiat(address owner, uint256 amount, uint256 deadline, bytes memory permitSig, uint256 txId) external",
    "function transferFrom(address _from, address _to, uint256 _amount, uint256 _validAfter, uint256 _validBefore, bytes32 _nonce, bytes memory _signature, uint256 _txId) external"
];

const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, systemWallet);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/burn', async (req, res) => {
    const { owner, value, deadline, signature, txId } = req.body;

    try {
        console.log('burnForFiat 호출 시도...');
        const burnTx = await tokenContract.burnForFiat(owner, value, deadline, signature, txId);
        await burnTx.wait();
        console.log('burnForFiat 호출 성공:', burnTx.hash);
    } catch (error) {
        console.error('소각 프로세스 중 오류 발생:', error);
        res.status(500).json({ error: '토큰 소각에 실패했습니다.' });
    }
});

app.post('/transfer', async (req, res) => {
    const { owner, to, value, validAfter, validBefore, nonce, signature, txId } = req.body;

    try {
        console.log('transferFrom 호출 시도...');
        const transferTx = await tokenContract.transferFrom(owner, to, value, validAfter, validBefore, nonce, signature, txId);
        await transferTx.wait();
        console.log('transferFrom 호출 성공:', transferTx.hash);
    } catch (error) {
        console.error('전송 프로세스 중 오류 발생:', error);
        res.status(500).json({ error: '토큰 전송에 실패했습니다.' });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

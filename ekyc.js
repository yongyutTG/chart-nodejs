const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // นำเข้า cors

const app = express();
const port = 3000;

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'chart_example',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});


// เปิดใช้งาน CORS สำหรับทุกโดเมน
app.use(cors());
// app.use(cors({
//     origin: 'http://localhost', // อนุญาตให้โดเมนนี้เข้าถึง
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // อนุญาตเฉพาะเมธอดที่กำหนด
//     allowedHeaders: ['Content-Type', 'Authorization'] // อนุญาตเฉพาะ Header ที่กำหนด
//   }));
  
// เส้นทาง API
app.get('/ekyc-year', (req, res) => {
//   const year = req.query.year || new Date().getFullYear();
  const year = req.query.year 
  const sql = `
    SELECT DATE_FORMAT(date_ekyc, '%m') as month, COUNT(DISTINCT mem_id) as count
    FROM ekyc_detail
    WHERE YEAR(date_ekyc) = ?
    GROUP BY month
    ORDER BY month`;

  connection.query(sql, [year], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
      return;
    }

    const monthlyCounts = {};
    const months = {
      "01": "มกราคม", "02": "กุมภาพันธ์", "03": "มีนาคม", "04": "เมษายน",
      "05": "พฤษภาคม", "06": "มิถุนายน", "07": "กรกฎาคม", "08": "สิงหาคม",
      "09": "กันยายน", "10": "ตุลาคม", "11": "พฤศจิกายน", "12": "ธันวาคม"
    };

    let totalCount = 0; // ตัวแปรสำหรับเก็บยอดรวมทั้งหมด

    results.forEach(row => {
      monthlyCounts[months[row.month]] = row.count;
      totalCount += row.count; // บวกจำนวนสมาชิกในแต่ละเดือนเข้ากับยอดรวม
    });

    const labels = Object.keys(monthlyCounts);
    const values = Object.values(monthlyCounts);

    const response = {
      labels: labels,
      datasets: [
        {
          label: "จำนวนสมาชิกที่ทำ E-KYC ต่อเดือนในปี",
          backgroundColor: "rgba(35,137,231,0.7)",
          borderColor: "rgba(35,137,231,1)",
          borderWidth: 1,
          data: values
        }
      ],
      total_count: totalCount // ส่งยอดรวมทั้งหมดไปยัง JavaScript
    };

    res.json(response);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

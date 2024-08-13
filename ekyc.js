const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); 

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

app.use(cors());

app.get('/ekyc-year', (req, res) => {
  const year = req.query.year;


  // //ไม่นับซ้ำ
  // const sql = `   
  //   SELECT DATE_FORMAT(date_ekyc, '%m') as month, 
  //          SUM(CASE WHEN max_address IN ('TG01', 'TG02', 'TG03', 'TG04', 'TG05', 'TG06', 'TG07', 'TG08', 'TG09', 'TG10') THEN 1 ELSE 0 END) as group1,
  //          SUM(CASE WHEN max_address IN ('TG11', 'TG12', 'TG13', 'TG14', 'TG15', 'TG16', 'TG17', 'TG18') THEN 1 ELSE 0 END) as group2,
  //          SUM(CASE WHEN max_address IN ('TG19', 'TG20', 'TG21', 'TG22', 'TG23', 'TG24', 'TG25') THEN 1 ELSE 0 END) as group3
  //   FROM ekyc_detail
  //   WHERE YEAR(date_ekyc) = ?
  //   GROUP BY month
  //   ORDER BY month
  // `;
  const sql = `
  SELECT DATE_FORMAT(date_ekyc, '%m') as month,  
         COUNT(DISTINCT CASE WHEN max_address IN ('TG01', 'TG02', 'TG03', 'TG04', 'TG05', 'TG06', 'TG07', 'TG08', 'TG09', 'TG10') THEN mem_id ELSE NULL END) as group1,
         COUNT(DISTINCT CASE WHEN max_address IN ('TG11', 'TG12', 'TG13', 'TG14', 'TG15', 'TG16', 'TG17', 'TG18') THEN mem_id ELSE NULL END) as group2,
         COUNT(DISTINCT CASE WHEN max_address IN ('TG19', 'TG20', 'TG21', 'TG22', 'TG23', 'TG24', 'TG25') THEN mem_id ELSE NULL END) as group3
  FROM ekyc_detail
  WHERE YEAR(date_ekyc) = ?
  GROUP BY month
  ORDER BY month
`;

  connection.query(sql, [year], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
      return;
    }

    const monthlyCounts = { group1: {}, group2: {}, group3: {} };
    const months = {
      "01": "มกราคม", "02": "กุมภาพันธ์", "03": "มีนาคม", "04": "เมษายน",
      "05": "พฤษภาคม", "06": "มิถุนายน", "07": "กรกฎาคม", "08": "สิงหาคม",
      "09": "กันยายน", "10": "ตุลาคม", "11": "พฤศจิกายน", "12": "ธันวาคม"
    };

    let totalCount = 0; // ตัวแปรสำหรับเก็บยอดรวมทั้งหมด

    results.forEach(row => {
      const month = months[row.month];
      monthlyCounts.group1[month] = row.group1;
      monthlyCounts.group2[month] = row.group2;
      monthlyCounts.group3[month] = row.group3;

      // คำนวณยอดรวมทั้งหมด
      totalCount += row.group1 + row.group2 + row.group3;
    });

    const labels = Object.keys(monthlyCounts.group1);
    const response = {
      labels: labels,
      datasets: [
        {
          label: "สำนักงานลาดพร้าว",
          backgroundColor: "rgba(75,192,192,0.7)",
          borderColor: "rgba(75,192,192,1)",
          data: Object.values(monthlyCounts.group1)
        },
        {
          label: "สำนักงานดอนเมือง",
          backgroundColor: "rgba(153,102,255,0.7)",
          borderColor: "rgba(153,102,255,1)",
          data: Object.values(monthlyCounts.group2)
        },
        {
          label: "สำนักงานกิ่งแก้ว",
          backgroundColor: "rgba(255,159,64,0.7)",
          borderColor: "rgba(255,159,64,1)",
          data: Object.values(monthlyCounts.group3)
        }
      ],
      total_count: totalCount // เพิ่มยอดรวมทั้งหมดใน response
    };

    res.json(response);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

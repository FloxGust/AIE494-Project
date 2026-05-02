Project Assignment: High-Throughput Image Classification Service: The MLOps Challenge
ให้แต่ละกลุ่มพัฒนา API สําหรับจําแนกรูปภาพ (Image Classification) ที่สามารถรองรับการเรียกใช้งานพร้อม
กันจํานวนมากได้อย่างมีประสิทธิภาพ โดยใช้โมเดลที่ผ่านการปรับแต่งให้เร็วและเล็กที่สุด และวางระบบส่งมอบ
งานอัตโนมัติ (CI/CD) ไปยัง Cloud
ขั้นตอนการดําเนินงาน (Project Phases) 
Model Optimization 
1. Model Selection: เลือกโมเดล Image Classification จาก Hugging Face 
2. Inference Test: ทดสอบรันโมเดลแบบปกติเพื่อเก็บค่า Baseline (ความเร็วและขนาดไฟล์)
3. Conversion: แปลงโมเดลให้อยู่ในรูปแบบ ONNX Format 
4. Quantization: ทํา Dynamic Quantization 
5. Data Collection: บันทึกผลเปรียบเทียบ Speed (Latency) และขนาดไฟล์ (Model Size) ระหว่าง 
Original vs ONNX vs Quantized
API Development & Production Handling 
1. Framework: สร้าง API ด้วย FastAPI โดยใช้async def สําหรับการรับส่งข้อมูล
2. Concurrency: ใช้ ProcessPoolExecutor หรือ Multiprocessing ในการรันโมเดล (CPU-bound) 
เพื่อป้องกัน API Frozen 
3. Production Error Handling :
o ใช้Pydantic ตรวจสอบความถูกต้องของ Input
o ดักจับ Error กรณีไฟล์ไม่ใช่รูปภาพ, ไฟล์เสีย (Corrupted), หรือขนาดไฟล์ใหญ่เกินไป
o ตอบกลับด้วย HTTP Status Code ที่เหมาะสม (เช่น 400 Bad Request ไม่ใช่ 500 เสมอไป)
4. Packaging: เขียน Dockerfile เพื่อแพ็กแอปพลิเคชันและโมเดลให้มีขนาดเล็กที่สุด


Automation & CI/CD 
1. Unit Testing: เขียน Test ด้วย pytest เพื่อเช็คว่า:
o API Endpoint /predict ทํางานได้และตอบกลับเป็น JSON ที่ถูกต้อง
o โมเดลสามารถทํานายผลได้ถูกต้องตามที่คาดหวัง
2. GitHub Actions: ตั้งค่า Workflow ให้รัน Unit Test ทุกครั้งที่มีการ Push โค้ด
3. Auto-Deployment: หาก Test ผ่าน 100% ให้ระบบ Build และ Deploy ไปที่ Hugging Face 
Spaces โดยอัตโนมัติ (Continuous Deployment)
Performance Testing 
1. JMeter Loadtest: ทําการทดสอบระบบทั้งบน Local (Docker) และบน Cloud (Hugging Face)
2. Analysis: วิเคราะห์ค่า Throughput (TPS) และ Latency (P95) เพื่อหาจุดวิกฤตที่ระบบเริ่มตอบสนอง
ช้าลง หรือคอขวดของทรัพยากร

สิ่งที่ต้องส่งมอบ (Deliverables)
1. เอกสารรายงานโปรเจค (Project Report) เป็น PDF:
• อธิบายรายละเอียดโมเดลที่เลือกและจุดประสงค์การใช้งาน
• ผลการ Optimization (ตารางเปรียบเทียบ Size/Latency)
• อธิบายกลยุทธ์การจัดการ Error Handling และ Data Validation
• ผลการทดสอบจาก JMeter HTML Dashboard พร้อมบทวิเคราะห์ประสิทธิภาพ
• แผนผังระบบ (System Architecture) และภาพรวมระบบ รวมถึง CI/CD Pipeline
2. Source Code Repository (GitHub):
• โค้ดโปรเจคทั้งหมดที่มีโครงสร้างชัดเจน
• ไฟล์.github/workflows/ สําหรับ CI/CD
• ไฟล์README.md ที่ระบุวิธีการใช้งานและ cURL Command สําหรับเรียกใช้งาน API บน Cloud
3. Testing Artifacts:
• JMeter Test Plan (.jmx): ไฟล์สคริปต์ที่ใช้ทดสอบโหลด
• Postman Collection (JSON): ชุดคําสั่งสําหรับเรียกใช้งาน API
• cURL Command: ตัวอย่างคําสั่งที่ใช้เรียก /predict พร้อมการส่งไฟล์ภาพจริง
Presentation (การนําเสนอ) ในวันที่ 9 พ.ค. 2569:
• สไลด์นําเสนอสรุปขั้นตอนการทําและผลลัพธ์
• Live Demo: แสดงการทํางานของ API บน Cloud
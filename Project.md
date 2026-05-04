# Project Assignment: High-Throughput Image Classification Service: The MLOps Challenge

ให้แต่ละกลุ่มพัฒนา API สําหรับจําแนกรูปภาพ (Image Classification) ที่สามารถรองรับการเรียกใช้งานพร้อม
กันจํานวนมากได้อย่างมีประสิทธิภาพ โดยใช้โมเดลที่ผ่านการปรับแต่งให้เร็วและเล็กที่สุด และวางระบบส่งมอบ
งานอัตโนมัติ (CI/CD) ไปยัง Cloud

---

## ขั้นตอนการดําเนินงาน (Project Phases)

### 🧠 Model Optimization

- [x] **1. Model Selection:** เลือกโมเดล Image Classification จาก Hugging Face  
- [x] **2. Inference Test:** ทดสอบรันโมเดลแบบปกติเพื่อเก็บค่า Baseline (ความเร็วและขนาดไฟล์)  
- [x] **3. Conversion:** แปลงโมเดลให้อยู่ในรูปแบบ ONNX Format  
- [x] **4. Quantization:** ทํา Dynamic Quantization  
- [x] **5. Data Collection:**  บันทึกผลเปรียบเทียบ Speed (Latency) และขนาดไฟล์ (Model Size) ระหว่าง Original vs ONNX vs Quantized  

---

### ⚙️ API Development & Production Handling

- [x] **1. Framework:** สร้าง API ด้วย FastAPI โดยใช้ async def สําหรับการรับส่งข้อมูล  

- [x] **2. Concurrency:** ใช้ ProcessPoolExecutor หรือ Multiprocessing ในการรันโมเดล (CPU-bound)  
      เพื่อป้องกัน API Frozen  

- [x] **3. Production Error Handling:**  
  - [x] ใช้ Pydantic ตรวจสอบความถูกต้องของ Input  
  - [x] ดักจับ Error กรณีไฟล์ไม่ใช่รูปภาพ, ไฟล์เสีย (Corrupted), หรือขนาดไฟล์ใหญ่เกินไป  
  - [x] ตอบกลับด้วย HTTP Status Code ที่เหมาะสม (เช่น 400 Bad Request ไม่ใช่ 500 เสมอไป)  

- [x] **4. Packaging:** เขียน Dockerfile เพื่อแพ็กแอปพลิเคชันและโมเดลให้มีขนาดเล็กที่สุด  

---

### 🔁 Automation & CI/CD

- [x] **1. Unit Testing:** เขียน Test ด้วย pytest เพื่อเช็คว่า:  
  - [x] API Endpoint /predict ทํางานได้และตอบกลับเป็น JSON ที่ถูกต้อง  
  - [x] โมเดลสามารถทํานายผลได้ถูกต้องตามที่คาดหวัง  

- [x] **2. GitHub Actions:** ตั้งค่า Workflow ให้รัน Unit Test ทุกครั้งที่มีการ Push โค้ด  

- [x] **3. Auto-Deployment:** หาก Test ผ่าน 100% ให้ระบบ Build และ Deploy ไปที่ Hugging Face Spaces โดยอัตโนมัติ (Continuous Deployment)  

---

### 📊 Performance Testing

- [x] **1. JMeter Loadtest:** ทําการทดสอบระบบทั้งบน Local (Docker) และบน Cloud (Hugging Face)  

- [ ] **2. Analysis:** วิเคราะห์ค่า Throughput (TPS) และ Latency (P95) เพื่อหาจุดวิกฤตที่ระบบเริ่มตอบสนองช้าลง หรือคอขวดของทรัพยากร  

---

## 📦 สิ่งที่ต้องส่งมอบ (Deliverables)

### 📄 1. เอกสารรายงานโปรเจค (Project Report) เป็น PDF:

- [x] อธิบายรายละเอียดโมเดลที่เลือกและจุดประสงค์การใช้งาน  
- [x] ผลการ Optimization (ตารางเปรียบเทียบ Size/Latency)  
- [x] อธิบายกลยุทธ์การจัดการ Error Handling และ Data Validation  
- [x] ผลการทดสอบจาก JMeter HTML Dashboard พร้อมบทวิเคราะห์ประสิทธิภาพ  
- [x] แผนผังระบบ (System Architecture) และภาพรวมระบบ รวมถึง CI/CD Pipeline  

---

### 💻 2. Source Code Repository (GitHub):

- [x] โค้ดโปรเจคทั้งหมดที่มีโครงสร้างชัดเจน  
- [x] ไฟล์ .github/workflows/ สําหรับ CI/CD  
- [x] ไฟล์ README.md ที่ระบุวิธีการใช้งานและ cURL Command สําหรับเรียกใช้งาน API บน Cloud  

---

### 🧪 3. Testing Artifacts:

- [x] JMeter Test Plan (.jmx): ไฟล์สคริปต์ที่ใช้ทดสอบโหลด  
- [x] Postman Collection (JSON): ชุดคําสั่งสําหรับเรียกใช้งาน API  
- [x] cURL Command: ตัวอย่างคําสั่งที่ใช้เรียก /predict พร้อมการส่งไฟล์ภาพจริง  

---

## 🎤 Presentation (การนําเสนอ) ในวันที่ 9 พ.ค. 2569:

- [ ] สไลด์นําเสนอสรุปขั้นตอนการทําและผลลัพธ์  
- [ ] Live Demo: แสดงการทํางานของ API บน Cloud  
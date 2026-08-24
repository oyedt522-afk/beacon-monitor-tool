
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','officer','staff');
CREATE TYPE public.attendance_status AS ENUM ('verified','requires_review','inspection_priority');
CREATE TYPE public.inspection_status AS ENUM ('completed','partially_completed','not_verified');
CREATE TYPE public.timeline_stage AS ENUM ('created','evidence_captured','submitted','verified');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  department text,
  designation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'officer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EMPLOYEES
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  posting_location text NOT NULL,
  expected_lat double precision NOT NULL,
  expected_lng double precision NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees read" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees admin write" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  check_in_face_captured boolean NOT NULL DEFAULT false,
  check_out_face_captured boolean NOT NULL DEFAULT false,
  gps_valid boolean NOT NULL DEFAULT true,
  is_late boolean NOT NULL DEFAULT false,
  missing_checkout boolean NOT NULL DEFAULT false,
  working_hours numeric(5,2) NOT NULL DEFAULT 0,
  status public.attendance_status NOT NULL DEFAULT 'requires_review',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attendance update" ON public.attendance FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.attendance_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  passed boolean,
  lat double precision,
  lng double precision,
  face_captured boolean NOT NULL DEFAULT false,
  reason text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_verifications TO authenticated;
GRANT ALL ON public.attendance_verifications TO service_role;
ALTER TABLE public.attendance_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "av read" ON public.attendance_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "av insert" ON public.attendance_verifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "av update" ON public.attendance_verifications FOR UPDATE TO authenticated USING (true);

-- ACTIVITIES
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  scheme_code text,
  location text NOT NULL,
  lat double precision,
  lng double precision,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  responsible_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities admin write" ON public.activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  inspector_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  inspected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.inspection_status NOT NULL DEFAULT 'not_verified',
  stage public.timeline_stage NOT NULL DEFAULT 'created',
  lat double precision,
  lng double precision,
  captured_at timestamptz NOT NULL DEFAULT now(),
  beneficiary_count integer NOT NULL DEFAULT 0,
  notes text,
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insp read" ON public.inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "insp insert" ON public.inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insp update" ON public.inspections FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.activity_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'photo',
  media_url text NOT NULL,
  caption text,
  lat double precision,
  lng double precision,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_evidence TO authenticated;
GRANT ALL ON public.activity_evidence TO service_role;
ALTER TABLE public.activity_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev read" ON public.activity_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "ev insert" ON public.activity_evidence FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  contact text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ben read" ON public.beneficiaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "ben insert" ON public.beneficiaries FOR INSERT TO authenticated WITH CHECK (true);

-- SAMPLE DATA
INSERT INTO public.employees (id, employee_code, full_name, department, designation, posting_location, expected_lat, expected_lng, phone) VALUES
('11111111-1111-4111-8111-000000000001','NRK-1001','Ramesh Patil','Rural Development','Block Development Officer','Panchayat Samiti, Baramati',18.1514,74.5779,'+91 98200 11001'),
('11111111-1111-4111-8111-000000000002','NRK-1002','Sunita Deshmukh','Health','Medical Officer','PHC Malegaon',20.5537,74.5250,'+91 98200 11002'),
('11111111-1111-4111-8111-000000000003','NRK-1003','Anil Kulkarni','Education','Cluster Head Master','ZP School, Wai',17.9500,73.8900,'+91 98200 11003'),
('11111111-1111-4111-8111-000000000004','NRK-1004','Meena Jadhav','Women & Child','Anganwadi Supervisor','ICDS Project, Shirur',18.8270,74.3730,'+91 98200 11004'),
('11111111-1111-4111-8111-000000000005','NRK-1005','Prakash Shinde','Water Supply','Junior Engineer','Jal Jeevan Sub-Division, Indapur',18.1200,75.0200,'+91 98200 11005'),
('11111111-1111-4111-8111-000000000006','NRK-1006','Vaishali More','Agriculture','Agriculture Assistant','Krishi Kendra, Daund',18.4640,74.5820,'+91 98200 11006'),
('11111111-1111-4111-8111-000000000007','NRK-1007','Sachin Gaikwad','Public Works','Site Supervisor','PWD Section, Purandar',18.2870,74.0100,'+91 98200 11007'),
('11111111-1111-4111-8111-000000000008','NRK-1008','Kavita Bhosale','Health','ANM','Sub-Centre, Velhe',18.2900,73.6300,'+91 98200 11008'),
('11111111-1111-4111-8111-000000000009','NRK-1009','Dattatray Pawar','Revenue','Talathi','Saza Office, Mulshi',18.4550,73.5100,'+91 98200 11009'),
('11111111-1111-4111-8111-000000000010','NRK-1010','Asha Nikam','Women & Child','Anganwadi Sevika','Anganwadi 14, Junnar',19.2080,73.8750,'+91 98200 11010'),
('11111111-1111-4111-8111-000000000011','NRK-1011','Nitin Sawant','Education','Beat Officer','Education Block, Ambegaon',19.1200,73.7300,'+91 98200 11011'),
('11111111-1111-4111-8111-000000000012','NRK-1012','Rekha Chavan','Rural Development','Gram Sevak','Gram Panchayat, Khed',18.8450,73.8900,'+91 98200 11012');

INSERT INTO public.attendance (employee_id, work_date, check_in_at, check_out_at, check_in_lat, check_in_lng, check_out_lat, check_out_lng, check_in_face_captured, check_out_face_captured, gps_valid, is_late, missing_checkout, working_hours, status, notes)
SELECT e.id,
       d::date,
       (d + time '09:35') - (random()*interval '25 min'),
       CASE WHEN r.k = 3 THEN NULL ELSE (d + time '17:45') - (random()*interval '40 min') END,
       e.expected_lat + (r.k * 0.0004), e.expected_lng + (r.k * 0.0004),
       e.expected_lat + (r.k * 0.0004), e.expected_lng + (r.k * 0.0004),
       true, r.k <> 3, r.k < 2, r.k >= 1, r.k = 3,
       CASE WHEN r.k = 3 THEN 0 ELSE 7.5 + (random()*1.2) END,
       CASE WHEN r.k = 0 THEN 'verified'::public.attendance_status
            WHEN r.k = 3 THEN 'inspection_priority'::public.attendance_status
            ELSE 'requires_review'::public.attendance_status END,
       CASE WHEN r.k = 2 THEN 'GPS reading outside posting perimeter' WHEN r.k = 3 THEN 'Checkout missing; repeated verification failures' ELSE NULL END
FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day') AS d
CROSS JOIN public.employees e
CROSS JOIN LATERAL (SELECT (('x'||substr(md5(e.employee_code||d::text),1,8))::bit(32)::int % 10 + 10) % 10 AS n) g
CROSS JOIN LATERAL (SELECT CASE WHEN g.n < 6 THEN 0 WHEN g.n < 8 THEN 1 WHEN g.n = 8 THEN 2 ELSE 3 END AS k) r
WHERE extract(dow from d) <> 0;

INSERT INTO public.attendance_verifications (attendance_id, requested_at, responded_at, passed, lat, lng, face_captured, reason)
SELECT a.id,
       a.work_date + time '13:20',
       CASE WHEN a.status = 'inspection_priority' THEN NULL ELSE a.work_date + time '13:26' END,
       CASE WHEN a.status = 'verified' THEN true WHEN a.status = 'inspection_priority' THEN false ELSE (a.gps_valid) END,
       a.check_in_lat, a.check_in_lng,
       a.status <> 'inspection_priority',
       CASE WHEN a.status = 'verified' THEN 'Random working-hour verification passed'
            WHEN a.status = 'inspection_priority' THEN 'No response to random verification'
            ELSE 'GPS drift during random verification' END
FROM public.attendance a;

INSERT INTO public.activities (id, name, department, scheme_code, location, lat, lng, scheduled_date, responsible_employee_id, description) VALUES
('22222222-2222-4222-8222-000000000001','Mid-Day Meal Distribution','Education','MDM-2026','ZP School, Wai',17.9500,73.8900,CURRENT_DATE - 2,'11111111-1111-4111-8111-000000000003','Daily hot cooked meal served to 180 students.'),
('22222222-2222-4222-8222-000000000002','Immunisation Camp','Health','NHM-IMM-14','PHC Malegaon',20.5537,74.5250,CURRENT_DATE - 1,'11111111-1111-4111-8111-000000000002','Routine immunisation for children under 5.'),
('22222222-2222-4222-8222-000000000003','Har Ghar Jal Pipeline Work','Water Supply','JJM-882','Indapur Cluster 4',18.1200,75.0200,CURRENT_DATE - 4,'11111111-1111-4111-8111-000000000005','Laying of 1.2 km distribution pipeline.'),
('22222222-2222-4222-8222-000000000004','Anganwadi Nutrition Distribution','Women & Child','ICDS-THR-9','Anganwadi 14, Junnar',19.2080,73.8750,CURRENT_DATE - 1,'11111111-1111-4111-8111-000000000010','Take-home ration for 62 beneficiaries.'),
('22222222-2222-4222-8222-000000000005','Rural Road Repair Phase II','Public Works','PMGSY-2211','Purandar Road Km 4-7',18.2870,74.0100,CURRENT_DATE - 5,'11111111-1111-4111-8111-000000000007','Pothole repair and edge strengthening.'),
('22222222-2222-4222-8222-000000000006','Soil Health Card Camp','Agriculture','SHC-451','Krishi Kendra, Daund',18.4640,74.5820,CURRENT_DATE - 3,'11111111-1111-4111-8111-000000000006','Soil sampling and card distribution to 90 farmers.'),
('22222222-2222-4222-8222-000000000007','Gram Sabha Meeting','Rural Development','GS-Q1','Gram Panchayat, Khed',18.8450,73.8900,CURRENT_DATE - 6,'11111111-1111-4111-8111-000000000012','Quarterly Gram Sabha with budget reading.'),
('22222222-2222-4222-8222-000000000008','Village Sanitation Drive','Rural Development','SBM-G-77','Baramati Ward 3',18.1514,74.5779,CURRENT_DATE,'11111111-1111-4111-8111-000000000001','Cleanliness drive and waste segregation demo.');

INSERT INTO public.inspections (id, activity_id, inspector_employee_id, status, stage, lat, lng, captured_at, beneficiary_count, notes, submitted_at, verified_at) VALUES
('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000011','completed','verified',17.9501,73.8902, now() - interval '2 days', 180,'Meal served on time. Register matched headcount.', now() - interval '2 days', now() - interval '1 day'),
('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000008','completed','verified',20.5538,74.5251, now() - interval '1 day', 74,'All doses recorded in the immunisation register.', now() - interval '1 day', now() - interval '6 hours'),
('33333333-3333-4333-8333-000000000003','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000005','partially_completed','submitted',18.1205,75.0208, now() - interval '4 days', 0,'Only 700 m of pipeline laid; trenching pending.', now() - interval '4 days', NULL),
('33333333-3333-4333-8333-000000000004','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000004','completed','verified',19.2081,73.8752, now() - interval '1 day', 62,'Ration bags weighed and verified.', now() - interval '1 day', now() - interval '3 hours'),
('33333333-3333-4333-8333-000000000005','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000007','not_verified','created',18.2900,74.0150, now() - interval '5 days', 0,'No evidence uploaded. Site staff unreachable.', NULL, NULL),
('33333333-3333-4333-8333-000000000006','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000006','partially_completed','evidence_captured',18.4642,74.5825, now() - interval '3 days', 54,'54 of 90 farmers covered; camp extended.', NULL, NULL),
('33333333-3333-4333-8333-000000000007','22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000009','not_verified','created',18.8600,73.9100, now() - interval '6 days', 0,'Attendance sheet missing; GPS mismatch of 1.8 km.', NULL, NULL);

INSERT INTO public.activity_evidence (inspection_id, media_type, media_url, caption, lat, lng, captured_at) VALUES
('33333333-3333-4333-8333-000000000001','photo','https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=60','Meal serving counter',17.9501,73.8902, now() - interval '2 days'),
('33333333-3333-4333-8333-000000000001','photo','https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800&q=60','Student attendance register',17.9501,73.8902, now() - interval '2 days'),
('33333333-3333-4333-8333-000000000002','photo','https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=60','Immunisation booth',20.5538,74.5251, now() - interval '1 day'),
('33333333-3333-4333-8333-000000000002','video','https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=60','Walkthrough of camp',20.5538,74.5251, now() - interval '1 day'),
('33333333-3333-4333-8333-000000000003','photo','https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=60','Pipeline trench at Km 0.7',18.1205,75.0208, now() - interval '4 days'),
('33333333-3333-4333-8333-000000000004','photo','https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=60','Take-home ration bags',19.2081,73.8752, now() - interval '1 day'),
('33333333-3333-4333-8333-000000000006','photo','https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=60','Soil sample collection',18.4642,74.5825, now() - interval '3 days');

INSERT INTO public.beneficiaries (inspection_id, full_name, contact, remarks) VALUES
('33333333-3333-4333-8333-000000000002','Sarita Kamble','+91 90000 20001','Child received DPT booster'),
('33333333-3333-4333-8333-000000000002','Imran Shaikh','+91 90000 20002','Measles dose 1'),
('33333333-3333-4333-8333-000000000004','Lata Waghmare','+91 90000 20003','Received 4 kg fortified ration'),
('33333333-3333-4333-8333-000000000004','Pooja Sathe','+91 90000 20004','Lactating mother kit'),
('33333333-3333-4333-8333-000000000006','Bhaskar Jagtap','+91 90000 20005','Soil card issued'),
('33333333-3333-4333-8333-000000000006','Ganesh Thorat','+91 90000 20006','Sample collected, card pending');

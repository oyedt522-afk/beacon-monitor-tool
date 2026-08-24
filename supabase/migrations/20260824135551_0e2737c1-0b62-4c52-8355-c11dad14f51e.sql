-- Link employees to auth accounts for ownership checks
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Helper: operational staff (admins + officers) manage department data
CREATE OR REPLACE FUNCTION public.can_operate(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','officer')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_employee(_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = _employee_id AND e.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_attendance(_attendance_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendance a
    JOIN public.employees e ON e.id = a.employee_id
    WHERE a.id = _attendance_id AND e.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_inspection(_inspection_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inspections i
    LEFT JOIN public.employees e ON e.id = i.inspector_employee_id
    WHERE i.id = _inspection_id
      AND (i.inspected_by = auth.uid() OR e.user_id = auth.uid())
  );
$$;

-- employees
DROP POLICY IF EXISTS "employees read" ON public.employees;
CREATE POLICY "employees read" ON public.employees FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR user_id = auth.uid());

-- activities
DROP POLICY IF EXISTS "activities read" ON public.activities;
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()));

-- attendance
DROP POLICY IF EXISTS "attendance read" ON public.attendance;
DROP POLICY IF EXISTS "attendance insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance update" ON public.attendance;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_employee(employee_id));
CREATE POLICY "attendance insert" ON public.attendance FOR INSERT TO authenticated
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_employee(employee_id));
CREATE POLICY "attendance update" ON public.attendance FOR UPDATE TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_employee(employee_id))
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_employee(employee_id));

-- attendance_verifications
DROP POLICY IF EXISTS "av read" ON public.attendance_verifications;
DROP POLICY IF EXISTS "av insert" ON public.attendance_verifications;
DROP POLICY IF EXISTS "av update" ON public.attendance_verifications;
CREATE POLICY "av read" ON public.attendance_verifications FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_attendance(attendance_id));
CREATE POLICY "av insert" ON public.attendance_verifications FOR INSERT TO authenticated
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_attendance(attendance_id));
CREATE POLICY "av update" ON public.attendance_verifications FOR UPDATE TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_attendance(attendance_id))
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_attendance(attendance_id));

-- inspections
DROP POLICY IF EXISTS "insp read" ON public.inspections;
DROP POLICY IF EXISTS "insp insert" ON public.inspections;
DROP POLICY IF EXISTS "insp update" ON public.inspections;
CREATE POLICY "insp read" ON public.inspections FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR inspected_by = auth.uid() OR public.owns_employee(inspector_employee_id));
CREATE POLICY "insp insert" ON public.inspections FOR INSERT TO authenticated
WITH CHECK (public.can_operate(auth.uid()) OR inspected_by = auth.uid() OR public.owns_employee(inspector_employee_id));
CREATE POLICY "insp update" ON public.inspections FOR UPDATE TO authenticated
USING (public.can_operate(auth.uid()) OR inspected_by = auth.uid() OR public.owns_employee(inspector_employee_id))
WITH CHECK (public.can_operate(auth.uid()) OR inspected_by = auth.uid() OR public.owns_employee(inspector_employee_id));

-- activity_evidence
DROP POLICY IF EXISTS "ev read" ON public.activity_evidence;
DROP POLICY IF EXISTS "ev insert" ON public.activity_evidence;
CREATE POLICY "ev read" ON public.activity_evidence FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_inspection(inspection_id));
CREATE POLICY "ev insert" ON public.activity_evidence FOR INSERT TO authenticated
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_inspection(inspection_id));

-- beneficiaries
DROP POLICY IF EXISTS "ben read" ON public.beneficiaries;
DROP POLICY IF EXISTS "ben insert" ON public.beneficiaries;
CREATE POLICY "ben read" ON public.beneficiaries FOR SELECT TO authenticated
USING (public.can_operate(auth.uid()) OR public.owns_inspection(inspection_id));
CREATE POLICY "ben insert" ON public.beneficiaries FOR INSERT TO authenticated
WITH CHECK (public.can_operate(auth.uid()) OR public.owns_inspection(inspection_id));

-- Lock down internal definer routines not meant to be called through the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.can_operate(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.owns_employee(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.owns_attendance(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.owns_inspection(uuid) FROM anon;
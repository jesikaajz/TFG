--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2026-03-26 18:49:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4912 (class 0 OID 16625)
-- Dependencies: 217
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_years (id, start_year, end_year) FROM stdin;
2	2026	2027
1	0	0
\.


--
-- TOC entry 4920 (class 0 OID 16661)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role) FROM stdin;
2	Jordi	jesteve@gmail.com	j432	teacher
3	Paula	paulita@gmail.com	pita	admin
4	Jesika	jp2000@gmail.com	jzk2	student
5	Juan	juan@example.com	hashed_password	admin
7	string	user@example.com	$2b$12$B.2VTl5ghFF/FYVydhO0rOxCCB2FP24dY8BcD7KJ/7C5dq4di6gPS	student
8	Lucía	lucia@gmail.com	$2b$12$CKeHG8sYBLHQ7JlJaphNZuX5pefTNfNWprMkJ3RLJEFUaiJkeOXAK	student
9	Neus	neus@gmail.com	$2b$12$Y7uOWK8XQdVn4r9vH1Tkx.0pltDdfdWfR8kTzyqrCYKZPIlAfKMHq	teacher
13	jesika	jvjp3107@gmail.com	$2b$12$.HXxoQ/KyS7regw1TDCNNuXNglCDhGEkv8jHIUa.Gk14eNngzIsoa	admin
15	gerard	gerardch21@gmail.com	$2b$12$JhAEKFBHwrP4YR.Eg9bAG.7SMkU658dh89hj55sj7xJljO6EKvYGe	admin
1	Gerard	gerar@gmail.com	1234	admin
16	kiki	kiki@gmail.com	$2b$12$bZZMW64B4PZvenSjyjART.6L1SHT5rnk4JekElzPL0Yv7rTO7zrtq	teacher
11	aleixx	aleixx21@gmail.com	$2b$12$mwl8MqcDNp40A6YARrKM6OBfhHrVi9t3WaI2CV3qD60R4qquW0Ufu	student
17	string	userrr@example.com	$2b$12$/WMoMiW8mwe9JltfYWSAUOHzVkmoCVGKiVzLpbKT5ghBJSC8aoEVC	student
\.


--
-- TOC entry 4913 (class 0 OID 16628)
-- Dependencies: 218
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, name, professor_id, description, year) FROM stdin;
1	Programación I	2	Introducción a la programación	2023
3	fopr	9	fundamentos de la programacion	2021
\.


--
-- TOC entry 4914 (class 0 OID 16633)
-- Dependencies: 219
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, course_id, academic_year_id, enrollment_date) FROM stdin;
1	1	1	1	2024-09-10
2	11	1	1	2026-03-18
3	4	1	1	2026-03-18
\.


--
-- TOC entry 4916 (class 0 OID 16641)
-- Dependencies: 221
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exercises (id, title, description, deadline, course_id, solution) FROM stdin;
1	ejercicio 1	ejercicio de programacion	2026-03-19	1	print("hello world");
2	dddg	string	2026-03-19	1	string
3	string	string	2026-03-19	1	string
4	string	string2	2026-03-19	1	string
5	Square number	print the square number for the sequence of number	2026-03-23	1	n = int(input())\\nprint(n*n)
6	prueba	prueba	2026-03-24	1	xx
7	ejercicio de prueba	ejercicio largo de prueba	2026-03-24	1	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}
8	Multiplicación de dos números	Lee dos números enteros desde la entrada estándar y muestra su multiplicación.	2026-03-26	1	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}
\.


--
-- TOC entry 4917 (class 0 OID 16646)
-- Dependencies: 222
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, student_id, exercise_id, code, submitted_at, status) FROM stdin;
2	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	error
3	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	pending
4	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	pending
5	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	completed
6	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	completed
7	11	5	n = int(input())\nprint(n)	2026-03-26 16:52:59.430842	completed
8	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	completed
9	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	pending
10	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	pending
11	11	5	n = int(input())\nprint(n*n)	2026-03-26 16:52:59.430842	completed
12	11	5	print(n*n)	2026-03-26 16:52:59.430842	pending
13	11	5	print(n*n)	2026-03-26 16:52:59.430842	pending
14	11	5	print(n*n)	2026-03-26 16:52:59.430842	pending
15	11	5	print(n*n)	2026-03-26 16:52:59.430842	pending
16	11	5	print(n*n)	2026-03-26 16:52:59.430842	pending
17	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
18	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	completed
19	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	completed
20	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	pending
21	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	completed
22	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	completed
23	11	5	print(int(n)/n*n)	2026-03-26 16:52:59.430842	completed
24	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
25	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
26	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
27	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
28	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
29	11	5	print(n*n)	2026-03-26 16:52:59.430842	completed
30	11	5	lado = int(input()) print(lado * lado)	2026-03-26 16:52:59.430842	completed
31	11	5	lado = int(input()) print(lado * lado)	2026-03-26 16:52:59.430842	completed
32	11	5	lado = int(input()) print(lado * lado)	2026-03-26 16:52:59.430842	completed
33	11	5	print(lado * lado)	2026-03-26 16:52:59.430842	completed
34	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
35	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
36	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
37	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
38	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
39	11	5	lado = int(input())\nprint(lado * lado)	2026-03-26 16:52:59.430842	completed
40	11	6	while True:\n    pass	2026-03-26 16:52:59.430842	completed
41	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
42	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
43	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
44	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	pending
45	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
46	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
47	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
48	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
49	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
50	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	pending
51	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
52	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
53	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
54	11	6	with open('/etc/passwd') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
55	11	6	with open('/etc/shadow') as f:\n    print(f.read())	2026-03-26 16:52:59.430842	completed
56	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	completed
57	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	completed
58	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	completed
59	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	pending
60	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	completed
61	11	6	import subprocess\nsubprocess.run(['ls', '/'])	2026-03-26 16:52:59.430842	completed
62	11	6	eval(2 + 2)	2026-03-26 16:52:59.430842	completed
63	11	6	exec(print(123))	2026-03-26 16:52:59.430842	completed
64	11	6	import os\nos.system(ls)	2026-03-26 16:52:59.430842	completed
65	11	6	import os\nos.system(ls)	2026-03-26 16:52:59.430842	completed
66	11	6	import os\nos.system(ls)	2026-03-26 16:52:59.430842	pending
67	11	6	import os\nos.system(ls)	2026-03-26 16:52:59.430842	completed
68	11	6	sss	2026-03-26 16:52:59.430842	completed
69	11	6	sss	2026-03-26 16:52:59.430842	completed
70	11	6	exec(2+2)	2026-03-26 16:52:59.430842	completed
71	11	6	exec(2+2)	2026-03-26 16:52:59.430842	pending
72	11	6	exec(2+2)	2026-03-26 16:52:59.430842	pending
73	11	6	exec(2+2)	2026-03-26 16:52:59.430842	pending
74	11	6	exec(2+2)	2026-03-26 16:52:59.430842	pending
75	11	6	exec(2+2)	2026-03-26 16:52:59.430842	pending
76	11	6	exec(2+2)	2026-03-26 16:52:59.430842	completed
77	11	6	exec(2+2)	2026-03-26 16:52:59.430842	completed
78	11	6	exec(2+2)	2026-03-26 16:52:59.430842	completed
79	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
80	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
81	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
82	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
83	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
84	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
85	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
86	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
87	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
88	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
89	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
90	11	5	#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << x * x;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
91	11	7	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
92	11	7	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}	2026-03-26 16:52:59.430842	pending
93	11	7	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
94	11	7	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, suma;\n    \n    cout << "Introduce el primer numero: ";\n    cin >> a;\n    \n    cout << "Introduce el segundo numero: ";\n    cin >> b;\n    \n    suma = a + b;\n    \n    cout << "La suma es: " << suma << endl;\n    \n    return 0;\n}	2026-03-26 16:52:59.430842	completed
95	11	7	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    if (!(cin >> a >> b)) return 0;\n    cout << a + b;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
96	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
97	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	pending
98	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	pending
99	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	pending
100	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	pending
101	11	8	#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b;\n    return 0;\n}	2026-03-26 16:52:59.430842	completed
102	11	8	string	2026-03-26 17:17:19.451029	pending
103	11	8	string	2026-03-26 17:18:34.393762	pending
104	11	8	string	2026-03-26 17:20:52.335909	pending
105	11	8	string	2026-03-26 17:23:51.806494	completed
\.


--
-- TOC entry 4915 (class 0 OID 16636)
-- Dependencies: 220
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluations (id, submission_id, score, passed_tests, total_tests, created_at) FROM stdin;
1	10	100.0	3	3	2026-03-23 19:45:27.743635
2	11	100.0	3	3	2026-03-23 19:46:46.115052
3	15	0.0	0	3	2026-03-23 20:31:12.273265
4	16	0.0	0	3	2026-03-23 20:32:29.194678
5	17	0.0	0	3	2026-03-23 20:33:33.218171
6	18	0.0	0	3	2026-03-23 20:40:47.546972
7	19	0.0	0	3	2026-03-23 20:45:48.444445
8	21	0.0	0	3	2026-03-23 20:50:38.53715
9	22	0.0	0	3	2026-03-23 20:51:33.570895
10	23	0.0	0	3	2026-03-23 20:53:43.650829
11	24	0.0	0	3	2026-03-23 20:54:15.016937
12	25	0.0	0	3	2026-03-23 20:56:45.490843
13	26	0.0	0	3	2026-03-23 20:59:48.574134
14	27	0.0	0	3	2026-03-23 21:01:07.711583
15	28	0.0	0	3	2026-03-23 21:02:43.63729
16	29	0.0	0	3	2026-03-23 21:05:37.61556
17	30	0.0	0	3	2026-03-23 21:07:22.633357
18	31	0.0	0	3	2026-03-23 21:08:28.731036
19	32	0.0	0	3	2026-03-23 21:08:52.674159
20	33	0.0	0	3	2026-03-23 21:09:48.541517
21	34	0.0	0	3	2026-03-23 21:12:28.631976
22	35	100.0	3	3	2026-03-23 21:13:35.833062
23	36	100.0	3	3	2026-03-24 14:13:47.911313
24	37	66.66666666666666	2	3	2026-03-24 15:36:35.744696
25	38	100.0	3	3	2026-03-24 15:39:38.764652
26	39	100.0	3	3	2026-03-24 15:44:40.459214
27	40	0.0	0	3	2026-03-24 15:52:01.109851
28	41	0.0	0	3	2026-03-24 15:52:28.617058
29	42	0.0	0	3	2026-03-24 15:54:48.84957
30	43	0.0	0	3	2026-03-24 15:56:45.129186
31	45	0.0	0	3	2026-03-24 16:01:21.131136
32	46	0.0	0	3	2026-03-24 16:03:51.366022
33	47	0.0	0	3	2026-03-24 16:05:53.811791
34	48	0.0	0	3	2026-03-24 16:06:28.851126
35	49	0.0	0	3	2026-03-24 16:10:21.814124
36	51	0.0	0	3	2026-03-24 16:12:41.919892
37	52	0.0	0	3	2026-03-24 16:14:13.884412
38	53	0.0	0	3	2026-03-24 16:15:50.22954
39	54	0.0	0	3	2026-03-24 16:17:04.227835
40	55	0.0	0	3	2026-03-24 16:19:17.104742
41	56	0.0	0	3	2026-03-24 16:35:52.494294
42	57	0.0	0	3	2026-03-24 16:38:32.141425
43	58	0.0	0	3	2026-03-24 16:41:08.330991
44	60	0.0	0	3	2026-03-24 16:47:18.014733
45	61	0.0	0	3	2026-03-24 16:52:57.895504
46	62	0.0	0	3	2026-03-24 16:56:33.860576
47	63	0.0	0	3	2026-03-24 16:57:03.83462
48	64	0.0	0	3	2026-03-24 16:57:32.350192
49	65	0.0	0	3	2026-03-24 17:11:01.841881
50	67	0.0	0	3	2026-03-24 17:20:37.225382
51	68	0.0	0	3	2026-03-24 17:22:52.210039
52	69	0.0	0	3	2026-03-24 17:24:15.953284
53	70	0.0	0	3	2026-03-24 17:25:12.404503
54	76	0.0	0	3	2026-03-24 20:08:33.973957
55	77	0.0	0	3	2026-03-24 20:16:44.865923
56	78	0.0	0	3	2026-03-24 20:19:40.127715
57	79	0.0	0	3	2026-03-24 20:22:21.179363
58	80	0.0	0	3	2026-03-24 20:24:15.913115
59	81	0.0	0	3	2026-03-24 20:26:59.909012
60	82	0.0	0	3	2026-03-24 20:29:46.81456
61	83	0.0	0	3	2026-03-24 20:45:42.642992
62	84	0.0	0	3	2026-03-24 20:51:44.015797
63	85	0.0	0	3	2026-03-24 20:53:27.116418
64	86	33.33333333333333	1	3	2026-03-24 20:59:10.121998
65	87	0.0	0	3	2026-03-24 21:05:15.049589
66	88	0.0	0	3	2026-03-24 21:05:57.904253
67	89	0.0	0	3	2026-03-24 21:09:07.677524
68	90	100.0	3	3	2026-03-24 21:09:53.825556
69	91	0.0	0	3	2026-03-24 21:20:17.349237
70	93	100.0	3	3	2026-03-24 21:28:34.865225
71	94	0.0	0	3	2026-03-26 14:30:27.575982
72	95	100.0	3	3	2026-03-26 14:37:20.271953
73	96	100.0	4	4	2026-03-26 14:47:29.537022
74	101	100.0	4	4	2026-03-26 15:50:18.676097
75	105	0.0	0	4	2026-03-26 17:24:16.05396
\.


--
-- TOC entry 4918 (class 0 OID 16651)
-- Dependencies: 223
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_cases (id, exercise_id, input, expected_output) FROM stdin;
1	5	5	25
2	5	10	100
3	5	2	4
4	6	5	25
5	6		0
6	6		secret
7	7	2 3	5
8	7	10 3	13
10	7	0 0	0
11	8	2 3	6
12	8	10 5	50
13	8	0 100	0
14	8	-4 5	-20
\.


--
-- TOC entry 4919 (class 0 OID 16656)
-- Dependencies: 224
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_results (id, evaluation_id, test_case_id, passed, actual_output, error, execution_time) FROM stdin;
1	2	1	t	25		0
2	2	2	t	100		0
3	2	3	t	4		0
4	5	1	f		Traceback (most recent call last):\n  File "/app/83ec0471-52de-48f9-980b-b0bcd8c23d79.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined\n	2.0112697999993543
5	5	2	f		Traceback (most recent call last):\n  File "/app/834dc60f-093b-48f9-98cd-2c478e545280.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined\n	1.7309229000002233
6	5	3	f		Traceback (most recent call last):\n  File "/app/8a1eab90-25bc-4de3-b29a-f1b31bb0547e.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined\n	1.600391199999649
7	6	1	f		Traceback (most recent call last):\n  File "/app/d482059e-2f9a-48a9-8ca2-dcd4e6df2821.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	3.5306826999994882
8	6	2	f		Traceback (most recent call last):\n  File "/app/e18f9e54-d2c2-4f47-9b0d-1d2eddf291bf.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	3.0312480000002324
9	6	3	f		Traceback (most recent call last):\n  File "/app/a82c5b7e-4117-4281-9685-915e0883db5e.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	1.790067399999316
10	7	1	f		Traceback (most recent call last):\n  File "/app/496c59db-28ce-4e36-9e49-d31bbcadf836.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	1.9459498999995049
11	7	2	f		Traceback (most recent call last):\n  File "/app/55c7dc8b-e31d-41b3-bc15-26ff7b20966a.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	1.4200448999999935
12	7	3	f		Traceback (most recent call last):\n  File "/app/6622d488-4880-4fc9-b82f-a666d536f076.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined\n	1.322740900000099
13	8	1	f		Traceback (most recent call last):\n  File "/app/0b8a955e-19ef-420b-9881-d1937473b853.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.7274286000001666
14	8	2	f		Traceback (most recent call last):\n  File "/app/2507454d-168b-4838-9e26-210a552c5c0f.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.739302800000587
15	8	3	f		Traceback (most recent call last):\n  File "/app/f53b9589-8f27-4256-b89d-20cc5204317d.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.9647714000002452
16	9	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.890742899999168
17	9	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.49085070000001
18	9	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	2.1488542999995843
19	10	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	2.3380755000016507
20	10	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.700152800000069
21	10	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(int(n)/n*n)\nNameError: name 'n' is not defined	1.4937148000008165
22	11	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.4798915999999736
23	11	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.27361910000036
24	11	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.3396614999983285
25	12	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	3.7138144000000466
26	12	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.6614810000010038
27	12	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.3861171999997168
28	13	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.735624099999768
29	13	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.2922799000007217
30	13	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.3264081000015722
31	14	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.9371463999996195
32	14	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.5748606999986805
33	14	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(n*n)\nNameError: name 'n' is not defined	1.4908749999995052
34	15	1	f		Timeout: el código tardó demasiado	3.038834000000861
35	15	2	f		Timeout: el código tardó demasiado	3.0490800000006857
36	15	3	f		Timeout: el código tardó demasiado	3.0386417000008805
37	16	1	f		Timeout: el código tardó más de 3 segundos	3.0489698000001226
38	16	2	f		Timeout: el código tardó más de 3 segundos	3.0413462999986223
39	16	3	f		Timeout: el código tardó más de 3 segundos	3.0448543000002246
40	17	1	f		Timeout: el código tardó más de 3 segundos	3.0438298000008217
41	17	2	f		Timeout: el código tardó más de 3 segundos	3.0225654000005306
42	17	3	f		Timeout: el código tardó más de 3 segundos	3.0443716999998287
43	18	1	f		Timeout: el código tardó demasiado	3.047594300000128
44	18	2	f		Timeout: el código tardó demasiado	3.0493423999996594
45	18	3	f		Timeout: el código tardó demasiado	3.038370100000975
46	19	1	f		Timeout: el código tardó demasiado	6.039055400000507
47	19	2	f		File "/app/code.py", line 1\n    lado = int(input()) print(lado * lado)\n                        ^^^^^\nSyntaxError: invalid syntax	2.424708399999872
48	19	3	f		File "/app/code.py", line 1\n    lado = int(input()) print(lado * lado)\n                        ^^^^^\nSyntaxError: invalid syntax	1.7831817000005685
49	20	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(lado * lado)\nNameError: name 'lado' is not defined	2.1089952000002086
50	20	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(lado * lado)\nNameError: name 'lado' is not defined	1.9312836999997671
51	20	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    print(lado * lado)\nNameError: name 'lado' is not defined	1.9532123999997566
52	21	1	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    lado = int(input())\nEOFError: EOF when reading a line	4.028196299999763
53	21	2	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    lado = int(input())\nEOFError: EOF when reading a line	2.3232030999988638
54	21	3	f		Traceback (most recent call last):\n  File "/app/code.py", line 1, in <module>\n    lado = int(input())\nEOFError: EOF when reading a line	2.1053792999991856
55	22	1	t	25		2.8981990000011137
56	22	2	t	100		2.194446899999093
57	22	3	t	4		2.0030165999996825
58	23	1	t	25		5.898038100000122
59	23	2	t	100		5.466106800013222
60	23	3	t	4		3.1844470000069123
61	24	1	f		Timeout: el código tardó demasiado	6.093961300008232
62	24	2	t	100		5.064639599993825
63	24	3	t	4		3.463217100012116
64	25	1	t	25		3.717660700000124
65	25	2	t	100		2.80134600000747
66	25	3	t	4		2.5846988999983296
67	26	1	t	25		2.7624620999995386
68	26	2	t	100		1.9495691000047373
69	26	3	t	4		1.880574800001341
70	27	4	f		Timeout: el código tardó demasiado	10.038606200003414
71	27	5	f		Timeout: el código tardó demasiado	10.039571999994223
72	27	6	f		Timeout: el código tardó demasiado	10.043328799991286
73	28	4	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.323082799994154
74	28	5	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.2916311000008136
75	28	6	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.0999784000014188
76	29	4	f	Ejecutando cÃ³digo seguro		2.183101799993892
77	29	5	f	Ejecutando cÃ³digo seguro		1.968606299997191
78	29	6	f	Ejecutando cÃ³digo seguro		1.9181221999897389
79	30	4	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		1.9939007999928435
80	30	5	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.1849660000007134
81	30	6	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		1.8930266000097618
82	31	4	f		sh: can't create /app/code.py: Permission denied	1.7877392000082182
83	31	5	f		sh: can't create /app/code.py: Permission denied	1.296347200011951
84	31	6	f		sh: can't create /app/code.py: Permission denied	1.3785736999998335
85	32	4	f		sh: can't create code.py: Permission denied	1.2863883000100031
86	32	5	f		sh: can't create code.py: Permission denied	1.3788504999974975
87	32	6	f		sh: can't create code.py: Permission denied	1.2306113999948138
88	33	4	f		sh: can't create code.py: Permission denied	1.670111999992514
89	33	5	f		sh: can't create code.py: Permission denied	1.2422384999954375
90	33	6	f		sh: can't create code.py: Permission denied	1.3827116999891587
91	34	4	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.638252500008093
92	34	5	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		1.9970977000048151
93	34	6	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		1.819833200002904
94	35	4	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.359672499995213
95	35	5	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.47792499999923166
96	35	6	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.4297857000055956
97	36	4	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.406828699997277
98	36	5	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.4421388000046136
99	36	6	f		docker: Error response from daemon: Duplicate mount point: /app\n\nRun 'docker run --help' for more information	0.4398355999874184
100	37	4	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		3.600832199997967
101	37	5	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.0531673999939812
102	37	6	f	root:x:0:0:root:/root:/bin/sh\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/mail:/sbin/nologin\nnews:x:9:13:news:/usr/lib/news:/sbin/nologin\nuucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin\ncron:x:16:16:cron:/var/spool/cron:/sbin/nologin\nftp:x:21:21::/var/lib/ftp:/sbin/nologin\nsshd:x:22:22:sshd:/dev/null:/sbin/nologin\ngames:x:35:35:games:/usr/games:/sbin/nologin\nntp:x:123:123:NTP:/var/empty:/sbin/nologin\nguest:x:405:100:guest:/dev/null:/sbin/nologin\nnobody:x:65534:65534:nobody:/:/sbin/nologin		2.06803029999719
103	38	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 11, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 6, in secure_open\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\n  File "/app/code.py", line 6, in <genexpr>\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\nNameError: name 'os' is not defined	2.2361550999921747
104	38	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 11, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 6, in secure_open\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\n  File "/app/code.py", line 6, in <genexpr>\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\nNameError: name 'os' is not defined	1.9792898000014247
105	38	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 11, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 6, in secure_open\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\n  File "/app/code.py", line 6, in <genexpr>\n    if not any(os.path.abspath(file).startswith(d) for d in allowed_dirs):\nNameError: name 'os' is not defined	1.9780742000002647
106	39	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/passwd is denied	2.165221900009783
107	39	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/passwd is denied	1.9827921999967657
108	39	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/passwd') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/passwd is denied	1.946603899996262
109	40	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/shadow') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/shadow is denied	1.8598581999976886
110	40	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/shadow') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/shadow is denied	2.177415900005144
111	40	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 12, in <module>\n    with open('/etc/shadow') as f:\n  File "/app/code.py", line 8, in secure_open\n    raise PermissionError(f"Access to {file} is denied")\nPermissionError: Access to /etc/shadow is denied	1.9784921999962535
112	41	4	f		SyntaxError: Non-UTF-8 code starting with '\\xf3' in file /app/code.py on line 16, but no encoding declared; see https://python.org/dev/peps/pep-0263/ for details	3.4896334999939427
113	41	5	f		SyntaxError: Non-UTF-8 code starting with '\\xf3' in file /app/code.py on line 16, but no encoding declared; see https://python.org/dev/peps/pep-0263/ for details	2.053486699995119
114	41	6	f		SyntaxError: Non-UTF-8 code starting with '\\xf3' in file /app/code.py on line 16, but no encoding declared; see https://python.org/dev/peps/pep-0263/ for details	2.1431302999990294
115	42	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 20, in <module>\n    import subprocess\nModuleNotFoundError: import of subprocess halted; None in sys.modules\nAttributeError: 'NoneType' object has no attribute '_shutdown'	2.4981268999981694
116	42	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 20, in <module>\n    import subprocess\nModuleNotFoundError: import of subprocess halted; None in sys.modules\nAttributeError: 'NoneType' object has no attribute '_shutdown'	2.227785399998538
117	42	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 20, in <module>\n    import subprocess\nModuleNotFoundError: import of subprocess halted; None in sys.modules\nAttributeError: 'NoneType' object has no attribute '_shutdown'	2.1914401999965776
118	43	4	f		Traceback (most recent call last):\n  File "<frozen importlib._bootstrap>", line 939, in _find_spec\nAttributeError: 'BlockedImporter' object has no attribute 'find_spec'\n\nDuring handling of the above exception, another exception occurred:\n\nTraceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 941, in _find_spec\n  File "<frozen importlib._bootstrap>", line 915, in _find_spec_legacy\n  File "/app/code.py", line 20, in find_module\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	2.311988899993594
119	43	5	f		Traceback (most recent call last):\n  File "<frozen importlib._bootstrap>", line 939, in _find_spec\nAttributeError: 'BlockedImporter' object has no attribute 'find_spec'\n\nDuring handling of the above exception, another exception occurred:\n\nTraceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 941, in _find_spec\n  File "<frozen importlib._bootstrap>", line 915, in _find_spec_legacy\n  File "/app/code.py", line 20, in find_module\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	2.837246299997787
120	43	6	f		Traceback (most recent call last):\n  File "<frozen importlib._bootstrap>", line 939, in _find_spec\nAttributeError: 'BlockedImporter' object has no attribute 'find_spec'\n\nDuring handling of the above exception, another exception occurred:\n\nTraceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 941, in _find_spec\n  File "<frozen importlib._bootstrap>", line 915, in _find_spec_legacy\n  File "/app/code.py", line 20, in find_module\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	2.345523600000888
121	44	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 26, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 945, in _find_spec\n  File "/app/code.py", line 21, in find_spec\n    raise PermissionError(f"Import of module '{fullname}' is denied")\nPermissionError: Import of module 'subprocess' is denied	4.639961299995775
122	44	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 26, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 945, in _find_spec\n  File "/app/code.py", line 21, in find_spec\n    raise PermissionError(f"Import of module '{fullname}' is denied")\nPermissionError: Import of module 'subprocess' is denied	3.218607900009374
123	44	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 26, in <module>\n    import subprocess\n  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load\n  File "<frozen importlib._bootstrap>", line 1002, in _find_and_load_unlocked\n  File "<frozen importlib._bootstrap>", line 945, in _find_spec\n  File "/app/code.py", line 21, in find_spec\n    raise PermissionError(f"Import of module '{fullname}' is denied")\nPermissionError: Import of module 'subprocess' is denied	3.704592499998398
124	45	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import subprocess\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	1.988533700001426
125	45	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import subprocess\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	2.026886600011494
126	45	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import subprocess\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'subprocess' is denied	1.8421562000003178
127	46	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    eval(2 + 2)\n  File "/app/code.py", line 23, in <lambda>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\n  File "/app/code.py", line 23, in <genexpr>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\nPermissionError: eval is disabled	2.137332199999946
128	46	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    eval(2 + 2)\n  File "/app/code.py", line 23, in <lambda>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\n  File "/app/code.py", line 23, in <genexpr>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\nPermissionError: eval is disabled	2.054360199996154
129	46	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    eval(2 + 2)\n  File "/app/code.py", line 23, in <lambda>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\n  File "/app/code.py", line 23, in <genexpr>\n    builtins.eval = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("eval is disabled"))\nPermissionError: eval is disabled	1.9557634999946458
130	47	4	f	123	Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    exec(print(123))\n  File "/app/code.py", line 24, in <lambda>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 24, in <genexpr>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	1.906378700005007
131	47	5	f	123	Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    exec(print(123))\n  File "/app/code.py", line 24, in <lambda>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 24, in <genexpr>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	2.002286200004164
132	47	6	f	123	Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    exec(print(123))\n  File "/app/code.py", line 24, in <lambda>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 24, in <genexpr>\n    builtins.exec = lambda *args, **kwargs: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	2.0291372000065167
133	48	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.7898788000020431
134	48	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.7736893000110285
135	48	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.774908499995945
136	49	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	2.235952200004249
137	49	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.6865454999933718
138	49	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.6676333000068553
139	50	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	4.244287100009387
140	50	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.9800038999965182
141	50	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    import os\n  File "/app/code.py", line 18, in blocked_import\n    raise PermissionError(f"Import of module '{name}' is denied")\nPermissionError: Import of module 'os' is denied	1.8359378999884939
142	51	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    sss\nNameError: name 'sss' is not defined	2.457726399996318
143	51	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    sss\nNameError: name 'sss' is not defined	1.6708368999970844
144	51	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 27, in <module>\n    sss\nNameError: name 'sss' is not defined	1.7467067000106908
145	52	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    sss\nNameError: name 'sss' is not defined	2.0393948999990243
146	52	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    sss\nNameError: name 'sss' is not defined	1.602516300001298
147	52	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    sss\nNameError: name 'sss' is not defined	1.5959470999951009
148	53	4	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    exec(2+2)\n  File "/app/code.py", line 21, in <lambda>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 21, in <genexpr>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	1.9796490999870002
149	53	5	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    exec(2+2)\n  File "/app/code.py", line 21, in <lambda>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 21, in <genexpr>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	1.579284399995231
150	53	6	f		Traceback (most recent call last):\n  File "/app/code.py", line 24, in <module>\n    exec(2+2)\n  File "/app/code.py", line 21, in <lambda>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\n  File "/app/code.py", line 21, in <genexpr>\n    builtins.exec = lambda *a, **k: (_ for _ in ()).throw(PermissionError("exec is disabled"))\nPermissionError: exec is disabled	1.591872599994531
151	54	4	f		docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: unable to retrieve OCI runtime error (open /run/containerd/io.containerd.runtime.v2.task/moby/ce96453b32070a3bb320d51e9e6574da6b724285e738a4fb977457f05bab6759/log.json: no such file or directory): /usr/local/bin/runsc did not terminate successfully: exit status 1: unknown\n\nRun 'docker run --help' for more information	6.407487100004801
152	54	5	f		docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: unable to retrieve OCI runtime error (open /run/containerd/io.containerd.runtime.v2.task/moby/e080f80aa59e4d75c87f159f08374eb1c62187146bd043dd7d479861b43085f6/log.json: no such file or directory): /usr/local/bin/runsc did not terminate successfully: exit status 1: unknown\n\nRun 'docker run --help' for more information	3.0166763000015635
153	54	6	f		docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: unable to retrieve OCI runtime error (open /run/containerd/io.containerd.runtime.v2.task/moby/2e0656560c0364c8075bfe33f97104aca02b4cac3e2e64544d883d32bab5e1f8/log.json: no such file or directory): /usr/local/bin/runsc did not terminate successfully: exit status 1: unknown\n\nRun 'docker run --help' for more information	2.311236400011694
154	55	4	f		Execution timeout	10.867398200003663
155	55	5	f		Execution timeout	10.881566199997906
156	55	6	f		Execution timeout	11.038210500002606
157	56	4	f		main.cpp:1:5: error: expected constructor, destructor, or type conversion before '(' token\n    1 | exec(2+2)\n      |     ^	4.428141399999731
158	56	5	f		main.cpp:1:5: error: expected constructor, destructor, or type conversion before '(' token\n    1 | exec(2+2)\n      |     ^	3.584247699996922
159	56	6	f		main.cpp:1:5: error: expected constructor, destructor, or type conversion before '(' token\n    1 | exec(2+2)\n      |     ^	3.9574577000021236
160	57	1	f		Execution timeout	10.825228500005323
161	57	2	f		/usr/bin/ld: cannot open output file program: Read-only file system\ncollect2: error: ld returned 1 exit status	9.786565000002156
162	57	3	f		/usr/bin/ld: cannot open output file program: Read-only file system\ncollect2: error: ld returned 1 exit status	8.036486199998762
163	58	1	f		Execution timeout	11.020733600002131
164	58	2	f		Execution timeout	11.003919499999029
165	58	3	f		Execution timeout	10.992793900004472
166	59	1	f		Execution timeout	10.835562100008246
167	59	2	f		timeout: failed to run command './program': Permission denied	8.897349199993187
168	59	3	f		timeout: failed to run command './program': Permission denied	9.066982599993935
169	60	1	f		Execution timeout	10.800746200009598
170	60	2	f		timeout: failed to run command './program': Permission denied	9.62435959999857
171	60	3	f		timeout: failed to run command './program': Permission denied	8.423868500001845
172	61	1	f		Execution timeout	11.049703300013789
173	61	2	f		Execution timeout	10.818883399988408
174	61	3	f		Execution timeout	11.492583500003093
175	62	1	f		Execution failed or timeout	7.015577600002871
176	62	2	f		Execution failed or timeout	6.767932999995537
177	62	3	f		Execution failed or timeout	6.742565200009267
178	63	1	f		Execution failed or timeout	6.752543399998103
179	63	2	f	25		6.822355199998128
180	63	3	f	100		6.981561300010071
181	64	1	t	25		6.900554699997883
182	64	2	f	25		6.793876000010641
183	64	3	f	100		6.863159500004258
184	65	1	f		Execution failed or timeout	7.249863600009121
185	65	2	f		Execution failed or timeout	7.252006900002016
186	65	3	f		Execution failed or timeout	7.154701199993724
187	66	1	f	4		6.929967999996734
188	66	2	f	25		6.906368099997053
189	66	3	f	100		6.91886560000421
190	67	1	f		Execution failed or timeout	7.032606699998723
191	67	2	f		Execution failed or timeout	6.8766538000054425
192	67	3	f		Execution failed or timeout	6.866171000001486
193	68	1	t	25		7.137745500003803
194	68	2	t	100		7.1066159999900265
195	68	3	t	4		7.03836059999594
196	69	7	f		Execution failed or timeout	7.132707000011578
197	69	8	f		Execution failed or timeout	7.094480500003556
198	69	10	f		Execution failed or timeout	7.219268900007592
199	70	7	t	5		40.06049770000391
200	70	8	t	13		15.130796800003736
201	70	10	t	0		20.88628960000642
202	71	7	f		Execution failed or timeout	7.864527400000952
203	71	8	f		Execution failed or timeout	7.4030960999953095
204	71	10	f		Execution failed or timeout	8.460595300013665
205	72	7	t	5		36.784146399993915
206	72	8	t	13		11.090861399978166
207	72	10	t	0		8.50818820000859
208	73	11	t	6		12.794684099993901
209	73	12	t	50		6.969323400000576
210	73	13	t	0		6.387054999999236
211	73	14	t	-20		6.589691500004847
212	74	11	t	6		10.595965100015746
213	74	12	t	50		5.283883500000229
214	74	13	t	0		5.281587600009516
215	74	14	t	-20		4.947274100006325
216	75	11	f	6	main.cpp:1:1: error: 'string' does not name a type\n    1 | string\n      | ^~~~~~	10.596016199997393
217	75	12	f	50	main.cpp:1:1: error: 'string' does not name a type\n    1 | string\n      | ^~~~~~	4.417345100024249
218	75	13	f	0	main.cpp:1:1: error: 'string' does not name a type\n    1 | string\n      | ^~~~~~	3.7054555999930017
219	75	14	f	-20	main.cpp:1:1: error: 'string' does not name a type\n    1 | string\n      | ^~~~~~	3.8149530999944545
\.


--
-- TOC entry 4935 (class 0 OID 0)
-- Dependencies: 229
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 3, true);


--
-- TOC entry 4936 (class 0 OID 0)
-- Dependencies: 227
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 3, true);


--
-- TOC entry 4937 (class 0 OID 0)
-- Dependencies: 228
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 3, true);


--
-- TOC entry 4938 (class 0 OID 0)
-- Dependencies: 233
-- Name: evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evaluations_id_seq', 75, true);


--
-- TOC entry 4939 (class 0 OID 0)
-- Dependencies: 230
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exercises_id_seq', 8, true);


--
-- TOC entry 4940 (class 0 OID 0)
-- Dependencies: 232
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 105, true);


--
-- TOC entry 4941 (class 0 OID 0)
-- Dependencies: 231
-- Name: test_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_cases_id_seq', 14, true);


--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 234
-- Name: test_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_results_id_seq', 219, true);


--
-- TOC entry 4943 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


-- Completed on 2026-03-26 18:49:46

--
-- PostgreSQL database dump complete
--


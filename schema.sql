--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_clients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    company_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: api_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_clients_id_seq OWNED BY public.api_clients.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    client_id integer NOT NULL,
    key_hash text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: api_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_tokens (
    id integer NOT NULL,
    client_id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: api_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_tokens_id_seq OWNED BY public.api_tokens.id;


--
-- Name: asset_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_documents (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    personnel_id integer,
    doc_type_id integer NOT NULL,
    description character varying(255),
    doc_link text,
    upload_date timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer
);


--
-- Name: asset_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asset_documents_id_seq OWNED BY public.asset_documents.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    model_id integer NOT NULL,
    model_year integer NOT NULL,
    plate_number character varying(20) NOT NULL,
    chassis_no character varying(50),
    engine_no character varying(50),
    ownership_type_id integer NOT NULL,
    owner_company_id integer,
    register_no character varying(50),
    register_date date,
    purchase_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by integer,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: assets_damage_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_damage_data (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    personnel_id integer,
    damage_type_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    event_date date NOT NULL,
    amount_cents integer NOT NULL,
    documents text,
    is_active boolean DEFAULT true NOT NULL,
    policy_id integer,
    CONSTRAINT amount_cents_check CHECK ((amount_cents >= 0))
);


--
-- Name: assets_damage_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_damage_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_damage_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_damage_data_id_seq OWNED BY public.assets_damage_data.id;


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: assets_maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_maintenance (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    maintenance_type_id integer NOT NULL,
    maintenance_date date NOT NULL,
    due_by_date date,
    km_reading integer,
    amount_cents integer NOT NULL,
    CONSTRAINT amount_cents_check CHECK ((amount_cents >= 0))
);


--
-- Name: assets_maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_maintenance_id_seq OWNED BY public.assets_maintenance.id;


--
-- Name: assets_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets_policies (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    policy_type_id integer NOT NULL,
    seller_company_id integer NOT NULL,
    insurance_company_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    policy_number character varying(100) NOT NULL,
    amount_cents integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    pid integer,
    CONSTRAINT amount_cents_check CHECK ((amount_cents >= 0))
);


--
-- Name: assets_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_policies_id_seq OWNED BY public.assets_policies.id;


--
-- Name: car_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_brands (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: car_brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_brands_id_seq OWNED BY public.car_brands.id;


--
-- Name: car_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_models (
    id integer NOT NULL,
    brand_id integer NOT NULL,
    name character varying(100) NOT NULL,
    type_id integer NOT NULL,
    capacity integer NOT NULL,
    detail text,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: car_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_models_id_seq OWNED BY public.car_models.id;


--
-- Name: car_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: car_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_types_id_seq OWNED BY public.car_types.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    country_id integer NOT NULL
);


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    tax_no character varying(50),
    address character varying(255),
    phone character varying(50),
    city_id integer,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone_code character varying(10)
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: damage_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damage_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: damage_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.damage_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: damage_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.damage_types_id_seq OWNED BY public.damage_types.id;


--
-- Name: doc_main_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doc_main_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: doc_main_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doc_main_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doc_main_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doc_main_types_id_seq OWNED BY public.doc_main_types.id;


--
-- Name: doc_sub_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doc_sub_types (
    id integer NOT NULL,
    main_type_id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: doc_sub_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doc_sub_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doc_sub_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doc_sub_types_id_seq OWNED BY public.doc_sub_types.id;


--
-- Name: fin_current_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_current_accounts (
    id integer NOT NULL,
    is_debit boolean NOT NULL,
    description character varying(255),
    payer_company_id integer NOT NULL,
    payee_company_id integer NOT NULL,
    amount_cents integer NOT NULL,
    transaction_date date NOT NULL,
    is_done boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: fin_current_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_current_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_current_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_current_accounts_id_seq OWNED BY public.fin_current_accounts.id;


--
-- Name: maintenance_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: maintenance_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_types_id_seq OWNED BY public.maintenance_types.id;


--
-- Name: ownership_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ownership_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: ownership_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ownership_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ownership_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ownership_types_id_seq OWNED BY public.ownership_types.id;


--
-- Name: penalties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penalties (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    driver_id integer,
    penalty_type_id integer NOT NULL,
    amount_cents integer NOT NULL,
    discounted_amount_cents integer NOT NULL,
    penalty_date date NOT NULL,
    last_date date,
    status character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by integer
);


--
-- Name: penalties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.penalties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: penalties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.penalties_id_seq OWNED BY public.penalties.id;


--
-- Name: penalty_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penalty_types (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    penalty_score integer NOT NULL,
    amount_cents integer NOT NULL,
    discounted_amount_cents integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_date date
);


--
-- Name: penalty_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.penalty_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: penalty_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.penalty_types_id_seq OWNED BY public.penalty_types.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel (
    id integer NOT NULL,
    tc_no bigint,
    name character varying(50) NOT NULL,
    surname character varying(50) NOT NULL,
    birthdate date,
    nation_id integer,
    birthplace_id integer,
    address character varying(255),
    phone_no character varying(50),
    status character varying(20),
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnel_id_seq OWNED BY public.personnel.id;


--
-- Name: personnel_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel_positions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: personnel_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnel_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personnel_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnel_positions_id_seq OWNED BY public.personnel_positions.id;


--
-- Name: personnel_work_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel_work_areas (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    work_area_id integer NOT NULL,
    position_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: personnel_work_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnel_work_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personnel_work_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnel_work_areas_id_seq OWNED BY public.personnel_work_areas.id;


--
-- Name: policy_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: policy_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.policy_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: policy_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.policy_types_id_seq OWNED BY public.policy_types.id;


--
-- Name: rental_agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_agreements (
    id integer NOT NULL,
    agreement_number character varying(50) NOT NULL,
    rental_company_id integer NOT NULL,
    tenant_company_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_short_term boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: rental_agreements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rental_agreements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rental_agreements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rental_agreements_id_seq OWNED BY public.rental_agreements.id;


--
-- Name: rental_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_assets (
    id integer NOT NULL,
    agreement_id integer NOT NULL,
    asset_id integer NOT NULL,
    mount_cents integer NOT NULL,
    vat_percent numeric(5,2) NOT NULL,
    km_hour_limit integer NOT NULL,
    km_total_limit integer NOT NULL
);


--
-- Name: rental_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rental_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rental_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rental_assets_id_seq OWNED BY public.rental_assets.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess text NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    company_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_areas (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(255),
    manager_id integer,
    start_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: work_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_areas_id_seq OWNED BY public.work_areas.id;


--
-- Name: api_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients ALTER COLUMN id SET DEFAULT nextval('public.api_clients_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: api_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens ALTER COLUMN id SET DEFAULT nextval('public.api_tokens_id_seq'::regclass);


--
-- Name: asset_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents ALTER COLUMN id SET DEFAULT nextval('public.asset_documents_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: assets_damage_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data ALTER COLUMN id SET DEFAULT nextval('public.assets_damage_data_id_seq'::regclass);


--
-- Name: assets_maintenance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_maintenance ALTER COLUMN id SET DEFAULT nextval('public.assets_maintenance_id_seq'::regclass);


--
-- Name: assets_policies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies ALTER COLUMN id SET DEFAULT nextval('public.assets_policies_id_seq'::regclass);


--
-- Name: car_brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_brands ALTER COLUMN id SET DEFAULT nextval('public.car_brands_id_seq'::regclass);


--
-- Name: car_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models ALTER COLUMN id SET DEFAULT nextval('public.car_models_id_seq'::regclass);


--
-- Name: car_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_types ALTER COLUMN id SET DEFAULT nextval('public.car_types_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: damage_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_types ALTER COLUMN id SET DEFAULT nextval('public.damage_types_id_seq'::regclass);


--
-- Name: doc_main_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_main_types ALTER COLUMN id SET DEFAULT nextval('public.doc_main_types_id_seq'::regclass);


--
-- Name: doc_sub_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_sub_types ALTER COLUMN id SET DEFAULT nextval('public.doc_sub_types_id_seq'::regclass);


--
-- Name: fin_current_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_current_accounts ALTER COLUMN id SET DEFAULT nextval('public.fin_current_accounts_id_seq'::regclass);


--
-- Name: maintenance_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_types ALTER COLUMN id SET DEFAULT nextval('public.maintenance_types_id_seq'::regclass);


--
-- Name: ownership_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ownership_types ALTER COLUMN id SET DEFAULT nextval('public.ownership_types_id_seq'::regclass);


--
-- Name: penalties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties ALTER COLUMN id SET DEFAULT nextval('public.penalties_id_seq'::regclass);


--
-- Name: penalty_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalty_types ALTER COLUMN id SET DEFAULT nextval('public.penalty_types_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel ALTER COLUMN id SET DEFAULT nextval('public.personnel_id_seq'::regclass);


--
-- Name: personnel_positions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_positions ALTER COLUMN id SET DEFAULT nextval('public.personnel_positions_id_seq'::regclass);


--
-- Name: personnel_work_areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_work_areas ALTER COLUMN id SET DEFAULT nextval('public.personnel_work_areas_id_seq'::regclass);


--
-- Name: policy_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_types ALTER COLUMN id SET DEFAULT nextval('public.policy_types_id_seq'::regclass);


--
-- Name: rental_agreements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_agreements ALTER COLUMN id SET DEFAULT nextval('public.rental_agreements_id_seq'::regclass);


--
-- Name: rental_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_assets ALTER COLUMN id SET DEFAULT nextval('public.rental_assets_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_areas ALTER COLUMN id SET DEFAULT nextval('public.work_areas_id_seq'::regclass);


--
-- Name: api_clients api_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_tokens api_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_pkey PRIMARY KEY (id);


--
-- Name: asset_documents asset_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents
    ADD CONSTRAINT asset_documents_pkey PRIMARY KEY (id);


--
-- Name: assets_damage_data assets_damage_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data
    ADD CONSTRAINT assets_damage_data_pkey PRIMARY KEY (id);


--
-- Name: assets_maintenance assets_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_maintenance
    ADD CONSTRAINT assets_maintenance_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assets assets_plate_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_plate_number_unique UNIQUE (plate_number);


--
-- Name: assets_policies assets_policies_asset_id_policy_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_asset_id_policy_number_unique UNIQUE (asset_id, policy_number);


--
-- Name: assets_policies assets_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_pkey PRIMARY KEY (id);


--
-- Name: car_brands car_brands_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_brands
    ADD CONSTRAINT car_brands_name_unique UNIQUE (name);


--
-- Name: car_brands car_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_brands
    ADD CONSTRAINT car_brands_pkey PRIMARY KEY (id);


--
-- Name: car_models car_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_pkey PRIMARY KEY (id);


--
-- Name: car_types car_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_types
    ADD CONSTRAINT car_types_name_unique UNIQUE (name);


--
-- Name: car_types car_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_types
    ADD CONSTRAINT car_types_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: companies companies_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_unique UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: countries countries_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_name_unique UNIQUE (name);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: damage_types damage_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_types
    ADD CONSTRAINT damage_types_name_unique UNIQUE (name);


--
-- Name: damage_types damage_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_types
    ADD CONSTRAINT damage_types_pkey PRIMARY KEY (id);


--
-- Name: doc_main_types doc_main_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_main_types
    ADD CONSTRAINT doc_main_types_name_unique UNIQUE (name);


--
-- Name: doc_main_types doc_main_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_main_types
    ADD CONSTRAINT doc_main_types_pkey PRIMARY KEY (id);


--
-- Name: doc_sub_types doc_sub_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_sub_types
    ADD CONSTRAINT doc_sub_types_pkey PRIMARY KEY (id);


--
-- Name: fin_current_accounts fin_current_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_current_accounts
    ADD CONSTRAINT fin_current_accounts_pkey PRIMARY KEY (id);


--
-- Name: maintenance_types maintenance_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_types
    ADD CONSTRAINT maintenance_types_name_unique UNIQUE (name);


--
-- Name: maintenance_types maintenance_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_types
    ADD CONSTRAINT maintenance_types_pkey PRIMARY KEY (id);


--
-- Name: ownership_types ownership_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ownership_types
    ADD CONSTRAINT ownership_types_name_unique UNIQUE (name);


--
-- Name: ownership_types ownership_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ownership_types
    ADD CONSTRAINT ownership_types_pkey PRIMARY KEY (id);


--
-- Name: penalties penalties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_pkey PRIMARY KEY (id);


--
-- Name: penalty_types penalty_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalty_types
    ADD CONSTRAINT penalty_types_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personnel personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_pkey PRIMARY KEY (id);


--
-- Name: personnel_positions personnel_positions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_positions
    ADD CONSTRAINT personnel_positions_name_unique UNIQUE (name);


--
-- Name: personnel_positions personnel_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_positions
    ADD CONSTRAINT personnel_positions_pkey PRIMARY KEY (id);


--
-- Name: personnel personnel_tc_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_tc_no_unique UNIQUE (tc_no);


--
-- Name: personnel_work_areas personnel_work_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_work_areas
    ADD CONSTRAINT personnel_work_areas_pkey PRIMARY KEY (id);


--
-- Name: policy_types policy_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_types
    ADD CONSTRAINT policy_types_name_unique UNIQUE (name);


--
-- Name: policy_types policy_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_types
    ADD CONSTRAINT policy_types_pkey PRIMARY KEY (id);


--
-- Name: rental_agreements rental_agreements_agreement_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_agreements
    ADD CONSTRAINT rental_agreements_agreement_number_unique UNIQUE (agreement_number);


--
-- Name: rental_agreements rental_agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_agreements
    ADD CONSTRAINT rental_agreements_pkey PRIMARY KEY (id);


--
-- Name: rental_assets rental_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_assets
    ADD CONSTRAINT rental_assets_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_pk PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: user_roles user_roles_user_id_role_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_pk PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_areas work_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_car_models_capacity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_models_capacity ON public.car_models USING btree (capacity);


--
-- Name: idx_rental_assets_vat_kmh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_assets_vat_kmh ON public.rental_assets USING btree (vat_percent, km_hour_limit);


--
-- Name: api_clients api_clients_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: api_keys api_keys_client_id_api_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_client_id_api_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.api_clients(id);


--
-- Name: api_tokens api_tokens_client_id_api_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_client_id_api_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.api_clients(id);


--
-- Name: api_tokens api_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: asset_documents asset_documents_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents
    ADD CONSTRAINT asset_documents_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: asset_documents asset_documents_created_by_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents
    ADD CONSTRAINT asset_documents_created_by_personnel_id_fk FOREIGN KEY (created_by) REFERENCES public.personnel(id);


--
-- Name: asset_documents asset_documents_doc_type_id_doc_sub_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents
    ADD CONSTRAINT asset_documents_doc_type_id_doc_sub_types_id_fk FOREIGN KEY (doc_type_id) REFERENCES public.doc_sub_types(id);


--
-- Name: asset_documents asset_documents_personnel_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_documents
    ADD CONSTRAINT asset_documents_personnel_id_personnel_id_fk FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);


--
-- Name: assets assets_created_by_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_created_by_personnel_id_fk FOREIGN KEY (created_by) REFERENCES public.personnel(id);


--
-- Name: assets_damage_data assets_damage_data_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data
    ADD CONSTRAINT assets_damage_data_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets_damage_data assets_damage_data_damage_type_id_damage_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data
    ADD CONSTRAINT assets_damage_data_damage_type_id_damage_types_id_fk FOREIGN KEY (damage_type_id) REFERENCES public.damage_types(id);


--
-- Name: assets_damage_data assets_damage_data_personnel_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data
    ADD CONSTRAINT assets_damage_data_personnel_id_personnel_id_fk FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);


--
-- Name: assets_damage_data assets_damage_data_policy_id_assets_policies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_damage_data
    ADD CONSTRAINT assets_damage_data_policy_id_assets_policies_id_fk FOREIGN KEY (policy_id) REFERENCES public.assets_policies(id);


--
-- Name: assets_maintenance assets_maintenance_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_maintenance
    ADD CONSTRAINT assets_maintenance_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets_maintenance assets_maintenance_maintenance_type_id_maintenance_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_maintenance
    ADD CONSTRAINT assets_maintenance_maintenance_type_id_maintenance_types_id_fk FOREIGN KEY (maintenance_type_id) REFERENCES public.maintenance_types(id);


--
-- Name: assets assets_model_id_car_models_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_model_id_car_models_id_fk FOREIGN KEY (model_id) REFERENCES public.car_models(id);


--
-- Name: assets assets_owner_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_owner_company_id_companies_id_fk FOREIGN KEY (owner_company_id) REFERENCES public.companies(id);


--
-- Name: assets assets_ownership_type_id_ownership_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_ownership_type_id_ownership_types_id_fk FOREIGN KEY (ownership_type_id) REFERENCES public.ownership_types(id);


--
-- Name: assets_policies assets_policies_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets_policies assets_policies_insurance_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_insurance_company_id_companies_id_fk FOREIGN KEY (insurance_company_id) REFERENCES public.companies(id);


--
-- Name: assets_policies assets_policies_policy_type_id_policy_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_policy_type_id_policy_types_id_fk FOREIGN KEY (policy_type_id) REFERENCES public.policy_types(id);


--
-- Name: assets_policies assets_policies_seller_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets_policies
    ADD CONSTRAINT assets_policies_seller_company_id_companies_id_fk FOREIGN KEY (seller_company_id) REFERENCES public.companies(id);


--
-- Name: assets assets_updated_by_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_updated_by_personnel_id_fk FOREIGN KEY (updated_by) REFERENCES public.personnel(id);


--
-- Name: car_models car_models_brand_id_car_brands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_brand_id_car_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.car_brands(id);


--
-- Name: car_models car_models_type_id_car_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_type_id_car_types_id_fk FOREIGN KEY (type_id) REFERENCES public.car_types(id);


--
-- Name: cities cities_country_id_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_country_id_countries_id_fk FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: companies companies_city_id_cities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: doc_sub_types doc_sub_types_main_type_id_doc_main_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_sub_types
    ADD CONSTRAINT doc_sub_types_main_type_id_doc_main_types_id_fk FOREIGN KEY (main_type_id) REFERENCES public.doc_main_types(id);


--
-- Name: fin_current_accounts fin_current_accounts_payee_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_current_accounts
    ADD CONSTRAINT fin_current_accounts_payee_company_id_companies_id_fk FOREIGN KEY (payee_company_id) REFERENCES public.companies(id);


--
-- Name: fin_current_accounts fin_current_accounts_payer_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_current_accounts
    ADD CONSTRAINT fin_current_accounts_payer_company_id_companies_id_fk FOREIGN KEY (payer_company_id) REFERENCES public.companies(id);


--
-- Name: penalties penalties_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: penalties penalties_created_by_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_created_by_personnel_id_fk FOREIGN KEY (created_by) REFERENCES public.personnel(id);


--
-- Name: penalties penalties_driver_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_driver_id_personnel_id_fk FOREIGN KEY (driver_id) REFERENCES public.personnel(id);


--
-- Name: penalties penalties_penalty_type_id_penalty_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_penalty_type_id_penalty_types_id_fk FOREIGN KEY (penalty_type_id) REFERENCES public.penalty_types(id);


--
-- Name: penalties penalties_updated_by_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_updated_by_personnel_id_fk FOREIGN KEY (updated_by) REFERENCES public.personnel(id);


--
-- Name: personnel personnel_birthplace_id_cities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_birthplace_id_cities_id_fk FOREIGN KEY (birthplace_id) REFERENCES public.cities(id);


--
-- Name: personnel personnel_nation_id_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_nation_id_countries_id_fk FOREIGN KEY (nation_id) REFERENCES public.countries(id);


--
-- Name: personnel_work_areas personnel_work_areas_personnel_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_work_areas
    ADD CONSTRAINT personnel_work_areas_personnel_id_personnel_id_fk FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);


--
-- Name: personnel_work_areas personnel_work_areas_position_id_personnel_positions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_work_areas
    ADD CONSTRAINT personnel_work_areas_position_id_personnel_positions_id_fk FOREIGN KEY (position_id) REFERENCES public.personnel_positions(id);


--
-- Name: personnel_work_areas personnel_work_areas_work_area_id_work_areas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel_work_areas
    ADD CONSTRAINT personnel_work_areas_work_area_id_work_areas_id_fk FOREIGN KEY (work_area_id) REFERENCES public.work_areas(id);


--
-- Name: rental_agreements rental_agreements_rental_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_agreements
    ADD CONSTRAINT rental_agreements_rental_company_id_companies_id_fk FOREIGN KEY (rental_company_id) REFERENCES public.companies(id);


--
-- Name: rental_agreements rental_agreements_tenant_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_agreements
    ADD CONSTRAINT rental_agreements_tenant_company_id_companies_id_fk FOREIGN KEY (tenant_company_id) REFERENCES public.companies(id);


--
-- Name: rental_assets rental_assets_agreement_id_rental_agreements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_assets
    ADD CONSTRAINT rental_assets_agreement_id_rental_agreements_id_fk FOREIGN KEY (agreement_id) REFERENCES public.rental_agreements(id) ON DELETE CASCADE;


--
-- Name: rental_assets rental_assets_asset_id_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_assets
    ADD CONSTRAINT rental_assets_asset_id_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: work_areas work_areas_city_id_cities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: work_areas work_areas_manager_id_personnel_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_manager_id_personnel_id_fk FOREIGN KEY (manager_id) REFERENCES public.personnel(id);


--
-- PostgreSQL database dump complete
--


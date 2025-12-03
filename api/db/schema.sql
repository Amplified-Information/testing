--
-- PostgreSQL database dump
--


-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-0+deb12u1)

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
-- Name: markets; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.markets (
    market_id uuid NOT NULL,
    statement text NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


ALTER TABLE public.markets OWNER TO your_db_user;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    tx_id1 uuid NOT NULL,
    tx_id2 uuid NOT NULL,
    is_partial boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.matches OWNER TO your_db_user;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.matches_id_seq OWNER TO your_db_user;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: order_requests; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.order_requests (
    id integer NOT NULL,
    tx_id uuid NOT NULL,
    market_id uuid NOT NULL,
    account_id text NOT NULL,
    market_limit text NOT NULL,
    price_usd double precision NOT NULL,
    qty double precision NOT NULL,
    sig text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    generated_at timestamp without time zone NOT NULL,
    net text DEFAULT 'testnet'::text NOT NULL,
    CONSTRAINT order_requests_market_limit_check CHECK ((market_limit = ANY (ARRAY['market'::text, 'limit'::text]))),
    CONSTRAINT order_requests_net_check CHECK ((net = ANY (ARRAY['mainnet'::text, 'testnet'::text, 'previewnet'::text]))),
    CONSTRAINT order_requests_price_usd_check CHECK (((price_usd >= ('-1.0'::numeric)::double precision) AND (price_usd <= (1.0)::double precision))),
    CONSTRAINT order_requests_qty_check CHECK ((qty > (0.0)::double precision))
);


ALTER TABLE public.order_requests OWNER TO your_db_user;

--
-- Name: order_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.order_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_requests_id_seq OWNER TO your_db_user;

--
-- Name: order_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.order_requests_id_seq OWNED BY public.order_requests.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO your_db_user;

--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: order_requests id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.order_requests ALTER COLUMN id SET DEFAULT nextval('public.order_requests_id_seq'::regclass);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (market_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: order_requests order_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.order_requests
    ADD CONSTRAINT order_requests_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- PostgreSQL database dump complete
--



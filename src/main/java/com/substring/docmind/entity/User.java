package com.substring.docmind.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long id;

    @Column(unique = true,nullable = false)
    private  String username;

    @Column(unique = false)
    private  String password;

    @Enumerated(EnumType.STRING)
    private  Role role;

    @Column(unique = true,nullable = false)
    private  String email;
}
